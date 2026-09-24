const db = require("../database/db");

const DEFAULT_STATE = db.DEFAULT_STATE;
const SETTINGS_KEYS = new Set(["voiceRate", "voicePitch", "selectedVoiceURI", "toneDuration", "toneSequence"]);
const TICKET_KEYS = new Set(["normalTicket", "preferentialTicket"]);
const ALLOWED_KEYS = new Set([...TICKET_KEYS, ...SETTINGS_KEYS]);
const MAX_RECENT_CALLS = 6;

function validationError(message) {
    const err = new Error(message);
    err.statusCode = 400;
    return err;
}

function normalizeInteger(value, min, max, fieldName) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw validationError(`${fieldName} deve ser um número inteiro entre ${min} e ${max}`);
    }
    return number;
}

function normalizeNumber(value, min, max, fieldName) {
    const number = Number.parseFloat(value);
    if (!Number.isFinite(number) || number < min || number > max) {
        throw validationError(`${fieldName} deve ser um número entre ${min} e ${max}`);
    }
    return number;
}

function normalizeToneSequence(value) {
    if (!Array.isArray(value) || value.length < 1 || value.length > 4) {
        throw validationError("toneSequence deve conter de 1 a 4 tons");
    }
    return value.map((tone, index) => normalizeInteger(tone, 0, 13, `toneSequence[${index}]`));
}

function normalizeUpdates(updates) {
    if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
        throw validationError("Payload de atualização inválido");
    }

    const nextUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
        if (!ALLOWED_KEYS.has(key)) {
            throw validationError(`Campo não permitido: ${key}`);
        }

        switch (key) {
            case "normalTicket":
            case "preferentialTicket":
                nextUpdates[key] = normalizeInteger(value, 0, 999, key);
                break;
            case "voiceRate":
                nextUpdates[key] = normalizeNumber(value, 0.5, 2, key);
                break;
            case "voicePitch":
                nextUpdates[key] = normalizeNumber(value, 0, 2, key);
                break;
            case "selectedVoiceURI":
                if (typeof value !== "string" || value.length > 512) {
                    throw validationError("selectedVoiceURI deve ser uma string de até 512 caracteres");
                }
                nextUpdates[key] = value;
                break;
            case "toneDuration":
                nextUpdates[key] = normalizeInteger(value, 50, 1000, key);
                break;
            case "toneSequence":
                nextUpdates[key] = normalizeToneSequence(value);
                break;
            default:
                break;
        }
    }

    return nextUpdates;
}

function getTicketKey(type) {
    return type === "P" ? "preferentialTicket" : "normalTicket";
}

function buildRecentCallEntry(type, ticket, isRepeat = false) {
    return {
        type,
        ticket: ticket ?? 0,
        timestamp: new Date().toISOString(),
        isRepeat,
    };
}

function rowToState(row, recentCalls = []) {
    return {
        id: row.id,
        channelId: row.channelId,
        channelName: row.channelName,
        normalTicket: row.normalTicket,
        preferentialTicket: row.preferentialTicket,
        voiceRate: row.voiceRate,
        voicePitch: row.voicePitch,
        selectedVoiceURI: row.selectedVoiceURI ?? DEFAULT_STATE.selectedVoiceURI,
        toneDuration: row.toneDuration,
        toneSequence: JSON.parse(row.toneSequence || JSON.stringify(DEFAULT_STATE.toneSequence)),
        recentCalls,
    };
}

function fetchRecentCalls(channelId, callback) {
    const num = Number.isFinite(Number(channelId)) ? Number(channelId) : 0;
    db.all(
        `SELECT id, type, ticket, timestamp
         FROM ticket_history
         WHERE channelId = ?
         ORDER BY id DESC
         LIMIT ?`,
        [num, MAX_RECENT_CALLS],
        (err, rows) => {
            if (err) {
                callback(err, null);
                return;
            }
            callback(
                null,
                rows.map((row) => ({
                    id: row.id,
                    type: row.type,
                    ticket: row.ticket,
                    timestamp: row.timestamp,
                })),
            );
        },
    );
}

const STATE_SELECT = `
    SELECT
        s.id, s.channelId,
        c.channelName,
        s.normalTicket, s.preferentialTicket,
        s.voiceRate, s.voicePitch, s.selectedVoiceURI,
        s.toneDuration, s.toneSequence
    FROM app_state s
    JOIN channels c ON c.id = s.channelId
`;

class TicketService {
    static getState(channelId, callback) {
        const id = Number.parseInt(channelId, 10);
        const num = Number.isFinite(id) ? id : 0;

        db.get(`${STATE_SELECT} WHERE c.id = ?`, [num], (err, row) => {
            if (err) {
                callback(err, null);
                return;
            }
            if (!row) {
                const notFound = new Error(`Canal ${num} não encontrado`);
                notFound.statusCode = 404;
                callback(notFound, null);
                return;
            }

            fetchRecentCalls(num, (historyErr, recentCalls) => {
                if (historyErr) {
                    callback(historyErr, null);
                    return;
                }
                callback(null, rowToState(row, recentCalls));
            });
        });
    }

    static _logTicketHistoryEntries(channelId, entries, callback) {
        if (!Array.isArray(entries) || entries.length === 0) {
            callback(null);
            return;
        }

        const [current, ...remaining] = entries;
        this._logTicketHistory(channelId, current.type, current.ticket, (err) => {
            if (err) {
                callback(err);
                return;
            }
            this._logTicketHistoryEntries(channelId, remaining, callback);
        });
    }

    static updateState(channelId, updates, callback) {
        let normalizedUpdates;
        try {
            normalizedUpdates = normalizeUpdates(updates);
        } catch (err) {
            callback(err, null);
            return;
        }

        this.getState(channelId, (err, currentState) => {
            if (err) {
                callback(err, null);
                return;
            }

            const ticketHistoryEntries = [];
            if (
                Object.prototype.hasOwnProperty.call(normalizedUpdates, "normalTicket") &&
                normalizedUpdates.normalTicket !== currentState.normalTicket
            ) {
                ticketHistoryEntries.push({ type: "N", ticket: normalizedUpdates.normalTicket });
            }
            if (
                Object.prototype.hasOwnProperty.call(normalizedUpdates, "preferentialTicket") &&
                normalizedUpdates.preferentialTicket !== currentState.preferentialTicket
            ) {
                ticketHistoryEntries.push({ type: "P", ticket: normalizedUpdates.preferentialTicket });
            }

            const nextState = { ...currentState, ...normalizedUpdates };

            db.run(
                `UPDATE app_state SET
                    normalTicket = ?,
                    preferentialTicket = ?,
                    voiceRate = ?,
                    voicePitch = ?,
                    selectedVoiceURI = ?,
                    toneDuration = ?,
                    toneSequence = ?
                WHERE channelId = ?`,
                [
                    nextState.normalTicket,
                    nextState.preferentialTicket,
                    nextState.voiceRate,
                    nextState.voicePitch,
                    nextState.selectedVoiceURI,
                    nextState.toneDuration,
                    JSON.stringify(nextState.toneSequence),
                    Number.isFinite(Number(channelId)) ? Number(channelId) : 0,
                ],
                (updateErr) => {
                    if (updateErr) {
                        callback(updateErr, null);
                        return;
                    }

                    const finish = (logErr) => {
                        if (logErr) {
                            callback(logErr, null);
                            return;
                        }
                        this.getState(channelId, callback);
                    };

                    if (ticketHistoryEntries.length === 0) {
                        finish(null);
                        return;
                    }

                    this._logTicketHistoryEntries(channelId, ticketHistoryEntries, finish);
                },
            );
        });
    }

    static _cleanupOldHistoryIfNeeded(callback) {
        if (!this._historyInsertCounter) {
            this._historyInsertCounter = 0;
            this._lastHistoryCleanupAt = 0;
        }

        this._historyInsertCounter += 1;
        const now = Date.now();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

        if (this._historyInsertCounter < 50 && now - this._lastHistoryCleanupAt < twoDaysMs) {
            return callback(null);
        }

        this._historyInsertCounter = 0;
        this._lastHistoryCleanupAt = now;

        db.run("DELETE FROM ticket_history WHERE timestamp <= datetime('now', '-15 day')", (err) => {
            callback(err);
        });
    }

    static _logTicketHistory(channelId, type, ticket, callback) {
        const num = Number.isFinite(Number(channelId)) ? Number(channelId) : 0;
        db.run("INSERT INTO ticket_history (channelId, type, ticket) VALUES (?, ?, ?)", [num, type, ticket], (err) => {
            if (err) {
                callback(err);
                return;
            }
            this._cleanupOldHistoryIfNeeded(callback);
        });
    }

    static advanceTicket(channelId, type, callback) {
        const ticketKey = type === "P" ? "preferentialTicket" : "normalTicket";
        const num = Number.isFinite(Number(channelId)) ? Number(channelId) : 0;

        db.run(
            `UPDATE app_state
             SET ${getTicketKey(type)} = CASE WHEN ${getTicketKey(type)} >= 999 THEN 0 ELSE ${getTicketKey(type)} + 1 END
             WHERE channelId = ?`,
            [num],
            (err) => {
                if (err) {
                    callback(err, null);
                    return;
                }

                this.getState(num, (stateErr, nextState) => {
                    if (stateErr) {
                        callback(stateErr, null);
                        return;
                    }

                    this._logTicketHistory(num, type, nextState?.[ticketKey] ?? 0, (logErr) => {
                        if (logErr) {
                            callback(logErr, null);
                            return;
                        }
                        this.getState(num, callback);
                    });
                });
            },
        );
    }

    static retreatTicket(channelId, type, callback) {
        const ticketKey = type === "P" ? "preferentialTicket" : "normalTicket";
        const num = Number.isFinite(Number(channelId)) ? Number(channelId) : 0;

        db.run(
            `UPDATE app_state
             SET ${getTicketKey(type)} = CASE WHEN ${getTicketKey(type)} <= 0 THEN 0 ELSE ${getTicketKey(type)} - 1 END
             WHERE channelId = ?`,
            [num],
            (err) => {
                if (err) {
                    callback(err, null);
                    return;
                }

                this.getState(num, (stateErr, nextState) => {
                    if (stateErr) {
                        callback(stateErr, null);
                        return;
                    }

                    this._logTicketHistory(num, type, nextState?.[ticketKey] ?? 0, (logErr) => {
                        if (logErr) {
                            callback(logErr, null);
                            return;
                        }
                        this.getState(num, callback);
                    });
                });
            },
        );
    }

    static callTicket(channelId, type, callback) {
        const ticketKey = type === "P" ? "preferentialTicket" : "normalTicket";
        const num = Number.isFinite(Number(channelId)) ? Number(channelId) : 0;

        this.getState(num, (err, currentState) => {
            if (err) {
                callback(err, null);
                return;
            }

            this._logTicketHistory(num, type, currentState?.[ticketKey] ?? 0, (logErr) => {
                if (logErr) {
                    callback(logErr, null);
                    return;
                }
                this.getState(num, callback);
            });
        });
    }

    static resetState(channelId, callback) {
        this.updateState(channelId, DEFAULT_STATE, callback);
    }
}

module.exports = TicketService;
