const db = require("../database/db");

const DEFAULT_STATE = db.DEFAULT_STATE;

class ChannelService {
    static listChannels(callback) {
        db.all("SELECT id, channelName FROM channels ORDER BY id ASC", (err, rows) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, rows);
        });
    }

    static createChannel(channelName, callback) {
        if (typeof channelName !== "string" || channelName.trim().length === 0 || channelName.length > 64) {
            const err = new Error("channelName deve ser uma string não vazia de até 64 caracteres");
            err.statusCode = 400;
            callback(err, null);
            return;
        }

        db.run("INSERT INTO channels (channelName) VALUES (?)", [channelName.trim()], function (err) {
            if (err) {
                callback(err, null);
                return;
            }

            const channelId = this.lastID;

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
                (stateErr) => {
                    if (stateErr) {
                        callback(stateErr, null);
                        return;
                    }
                    callback(null, {
                        id: channelId,
                        channelName: channelName.trim(),
                    });
                },
            );
        });
    }

    static deleteChannel(id, callback) {
        const channelId = Number.parseInt(id, 10);

        if (channelId === 0) {
            const forbidden = new Error("O canal 0 (Teste) não pode ser excluído");
            forbidden.statusCode = 403;
            callback(forbidden);
            return;
        }

        db.run("DELETE FROM channels WHERE id = ?", [channelId], (delErr) => {
            if (delErr) {
                callback(delErr);
                return;
            }
            if (this.changes === 0) {
                const notFound = new Error("Canal não encontrado");
                notFound.statusCode = 404;
                callback(notFound);
                return;
            }
            callback(null);
        });
    }
}

module.exports = ChannelService;
