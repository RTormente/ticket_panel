const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "..", "..", "data");
const DB_FILE = path.join(DB_DIR, "painel.db");
const SCHEMA_FILE = path.join(__dirname, "schema.sql");

// 1. Simplificado: Agora referenciamos apenas o id
const DEFAULT_CHANNEL = { id: 0, channelName: "Teste" };

const DEFAULT_STATE = {
    normalTicket: 0,
    preferentialTicket: 0,
    voiceRate: 1.4,
    voicePitch: 0.9,
    selectedVoiceURI: "daniel",
    toneDuration: 500,
    toneSequence: [12, 8, 12],
};

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error("Erro ao abrir banco de dados:", err);
    } else {
        console.log("Banco de dados conectado:", DB_FILE);
    }
});

db.configure("busyTimeout", 5000);
db.DEFAULT_STATE = DEFAULT_STATE; // Garante exportação para o Service

db.initialize = function initializeDatabase(callback) {
    db.run("PRAGMA foreign_keys = ON", (pragmaErr) => {
        if (pragmaErr) {
            callback(pragmaErr);
            return;
        }

        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='channels'", (err, row) => {
            if (err) {
                callback(err);
                return;
            }

            if (row) {
                runMigrations(buildMigrations, callback);
                return;
            }

            const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
            db.exec(schema, (schemaErr) => {
                if (schemaErr) {
                    callback(schemaErr);
                    return;
                }
                seedDefaultChannel(callback);
            });
        });
    });
};

// 2. Corrigido: Forçamos o id como 0 explicitamente no INSERT
function seedDefaultChannel(callback) {
    db.run(
        "INSERT INTO channels (id, channelName) VALUES (?, ?)",
        [DEFAULT_CHANNEL.id, DEFAULT_CHANNEL.channelName],
        function (err) {
            if (err) {
                callback(err);
                return;
            }
            const channelId = this.lastID; // Será 0
            db.run(
                `INSERT INTO app_state (
                    channelId, normalTicket, preferentialTicket,
                    voiceRate, voicePitch, selectedVoiceURI,
                    toneDuration, toneSequence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    channelId,
                    DEFAULT_STATE.normalTicket,
                    DEFAULT_STATE.preferentialTicket,
                    DEFAULT_STATE.voiceRate,
                    DEFAULT_STATE.voicePitch,
                    DEFAULT_STATE.selectedVoiceURI,
                    DEFAULT_STATE.toneDuration,
                    JSON.stringify(DEFAULT_STATE.toneSequence),
                ],
                callback,
            );
        },
    );
}

function buildMigrations(columns, tableNames, callback) {
    const columnNames = new Set(columns.map((c) => c.name));
    const migrations = [];

    migrations.push((cb) => {
        db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='app_state'", (err, row) => {
            if (err || !row) {
                cb(err);
                return;
            }
            const needsRebuild =
                row.sql.includes("CHECK(id = 1)") ||
                row.sql.includes("CHECK (id = 1)") ||
                row.sql.includes("recentCalls") ||
                !row.sql.includes("UNIQUE");
            if (!needsRebuild) {
                cb(null);
                return;
            }

            db.serialize(() => {
                db.run("PRAGMA foreign_keys = OFF");
                db.run(`CREATE TABLE IF NOT EXISTS app_state_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    channelId INTEGER NOT NULL UNIQUE,
                    normalTicket INTEGER NOT NULL DEFAULT 0,
                    preferentialTicket INTEGER NOT NULL DEFAULT 0,
                    voiceRate REAL NOT NULL DEFAULT 1.4,
                    voicePitch REAL NOT NULL DEFAULT 0.9,
                    selectedVoiceURI TEXT DEFAULT 'mute',
                    toneDuration INTEGER NOT NULL DEFAULT 500,
                    toneSequence TEXT NOT NULL DEFAULT '[]',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);
                db.run(`INSERT OR IGNORE INTO app_state_new
                    SELECT id, channelId, normalTicket, preferentialTicket, voiceRate, voicePitch,
                           selectedVoiceURI, toneDuration, toneSequence,
                           created_at, updated_at
                    FROM app_state
                    WHERE channelId IS NOT NULL
                      AND id IN (SELECT MAX(id) FROM app_state GROUP BY channelId)`);
                db.run("DROP TABLE app_state");
                db.run("ALTER TABLE app_state_new RENAME TO app_state");
                db.run("PRAGMA foreign_keys = ON", cb);
            });
        });
    });

    // 3. Atualizado: Criação da tabela sem referências à coluna antiga
    if (!tableNames.has("channels")) {
        migrations.push((cb) =>
            db.run(
                "CREATE TABLE IF NOT EXISTS channels (id INTEGER PRIMARY KEY AUTOINCREMENT, channelName TEXT NOT NULL)",
                cb,
            ),
        );
        migrations.push((cb) => db.run("INSERT OR IGNORE INTO channels (id, channelName) VALUES (0, 'Teste')", cb));
    }

    if (!tableNames.has("ticket_history")) {
        migrations.push((cb) =>
            db.run(
                `CREATE TABLE IF NOT EXISTS ticket_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    channelId INTEGER NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('N', 'P')),
                    ticket INTEGER NOT NULL,
                    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (channelId) REFERENCES channels(id) ON DELETE CASCADE
                )`,
                cb,
            ),
        );
    }

    if (!columnNames.has("channelId")) {
        migrations.push((cb) =>
            // Busca diretamente pelo id do canal de teste que é 0
            db.get("SELECT id FROM channels WHERE id = 0", (err, row) => {
                if (err) {
                    cb(err);
                    return;
                }
                const cid = row ? row.id : 0;
                db.run(`ALTER TABLE app_state ADD COLUMN channelId INTEGER NOT NULL DEFAULT ${cid}`, cb);
            }),
        );
    }

    migrations.push((cb) => {
        db.get("SELECT id FROM channels WHERE id = 0", (err, row) => {
            if (err || !row) {
                cb(err);
                return;
            }
            db.run("UPDATE app_state SET channelId = ? WHERE channelId IS NULL", [row.id], cb);
        });
    });

    migrations.push((cb) => {
        db.get("SELECT id FROM channels WHERE id = 0", (err, channel) => {
            if (err || !channel) {
                cb(err);
                return;
            }
            db.run(
                `INSERT OR IGNORE INTO app_state (
                    channelId, normalTicket, preferentialTicket,
                    voiceRate, voicePitch, selectedVoiceURI,
                    toneDuration, toneSequence
                ) VALUES (?, 0, 0, 1.4, 0.9, 'mute', 500, ?)`,
                [channel.id, JSON.stringify([12, 8, 12])],
                cb,
            );
        });
    });

    // Executa a lista de migrações montada acima
    runMigrationList(migrations, callback);
}

// Função auxiliar genérica para iterar na lista de migrações
function runMigrationList(migrations, callback) {
    if (migrations.length === 0) {
        return callback(null);
    }
    const currentMigration = migrations.shift();
    currentMigration((err) => {
        if (err) return callback(err);
        runMigrationList(migrations, callback);
    });
}

// Função fake/placeholder para chamar a checagem (ajuste conforme seu código real de leitura do schema)
function runMigrations(builderFunction, callback) {
    db.all("PRAGMA table_info(app_state)", (err, columns) => {
        if (err) return callback(err);
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
            if (err) return callback(err);
            const tableNames = new Set(rows.map((r) => r.name));
            builderFunction(columns, tableNames, callback);
        });
    });
}

module.exports = db;
