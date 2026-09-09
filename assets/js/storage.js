const STORAGE_KEY = "ticket_panel_configs";

export default class Storage {
    static defaults = Object.freeze({
        voiceRate: 1.4,
        voicePitch: 0.9,
        voiceVolume: 1,
        selectedVoiceURI: navigator.userAgent.includes("Windows")
            ? "daniel"
            : navigator.userAgent.includes("Linux")
              ? "Brazil)+UniversalRobot"
              : "mute",
        normalTicket: 0,
        preferentialTicket: 0,
        toneSequence: [12, 8, 12],
        toneDuration: 500,
        shortcuts: {
            nextNormal: {
                key: "NumpadAdd",
                display: "+",
                label: "Próxima senha normal",
            },
            nextPreferential: {
                key: "NumpadComma",
                display: ".",
                label: "Próxima senha preferencial",
            },
            previousNormal: {
                key: "NumpadDivide",
                display: "/",
                label: "Voltar senha normal",
            },
            previousPreferential: {
                key: "NumpadMultiply",
                display: "*",
                label: "Voltar senha preferencial",
            },
            callNormal: {
                key: "NumpadSubtract",
                display: "-",
                label: "Repete senha normal",
            },
            callPreferential: {
                key: "NumpadDecimal",
                display: ",",
                label: "Repete senha preferencial",
            },
        },
    });

    static #cache = null;

    static #clampNumber(value, min, max, fallback) {
        if (value === null || value === "") {
            return fallback;
        }

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return Math.min(max, Math.max(min, number));
    }

    static #clampInteger(value, min, max, fallback) {
        const number = this.#clampNumber(value, min, max, fallback);

        return number === null ? null : Math.trunc(number);
    }

    static #sanitizeShortcut(defaultShortcut, shortcut) {
        if (!shortcut || typeof shortcut !== "object" || Array.isArray(shortcut)) {
            return structuredClone(defaultShortcut);
        }

        return {
            key: typeof shortcut.key === "string" && shortcut.key.length <= 50 ? shortcut.key : defaultShortcut.key,
            display:
                typeof shortcut.display === "string" && shortcut.display.length > 0 && shortcut.display.length <= 20
                    ? shortcut.display
                    : defaultShortcut.display,
            label: defaultShortcut.label,
        };
    }

    static #sanitize(data) {
        const defaults = this.getDefaults();
        const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
        const shortcuts = {};

        Object.entries(defaults.shortcuts).forEach(([action, defaultShortcut]) => {
            shortcuts[action] = this.#sanitizeShortcut(defaultShortcut, source.shortcuts?.[action]);
        });

        return {
            ...defaults,
            voiceRate: this.#clampNumber(source.voiceRate, 0.5, 2, defaults.voiceRate),
            voicePitch: this.#clampNumber(source.voicePitch, 0, 2, defaults.voicePitch),
            voiceVolume: this.#clampNumber(source.voiceVolume, 0, 1, defaults.voiceVolume),
            selectedVoiceURI:
                typeof source.selectedVoiceURI === "string" && source.selectedVoiceURI.length <= 200
                    ? source.selectedVoiceURI
                    : defaults.selectedVoiceURI,
            normalTicket: this.#clampInteger(source.normalTicket, 0, 999, defaults.normalTicket),
            preferentialTicket: this.#clampInteger(source.preferentialTicket, 0, 999, defaults.preferentialTicket),
            toneSequence: Array.isArray(source.toneSequence)
                ? source.toneSequence
                      .map((tone) => this.#clampInteger(tone, 0, 13, null))
                      .filter((tone) => tone !== null)
                      .slice(0, 20)
                : defaults.toneSequence,
            toneDuration: this.#clampInteger(source.toneDuration, 50, 5000, defaults.toneDuration),
            shortcuts,
        };
    }

    static getDefaults() {
        return structuredClone(this.defaults);
    }

    static #invalidateCache() {
        this.#cache = null;
    }

    static load() {
        if (this.#cache !== null) {
            return this.#cache;
        }

        const stored = this.#read();

        if (!stored) {
            this.reset();
            this.#cache = this.getDefaults();
            return this.#cache;
        }

        const merged = this.#sanitize(this._deepMerge(this.getDefaults(), stored));

        this.#cache = merged;
        return merged;
    }

    static save(data = {}) {
        const updated = this.#sanitize(this._deepMerge(this.load(), data));

        this.#write(updated);
        this.#cache = updated;
    }

    static _deepMerge(target, source) {
        const result = structuredClone(target);

        Object.entries(source).forEach(([key, value]) => {
            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value) &&
                key in result &&
                typeof result[key] === "object" &&
                !Array.isArray(result[key])
            ) {
                result[key] = this._deepMerge(result[key], value);
                return;
            }

            result[key] = structuredClone(value);
        });

        return result;
    }

    static reset() {
        const defaults = this.getDefaults();
        this.#write(defaults);
        this.#cache = structuredClone(defaults);
        return this.#cache;
    }

    static get(key) {
        return this.load()[key];
    }

    static set(key, value) {
        this.save({ [key]: value });
    }

    static #read() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn("Storage read error", e);
            return null;
        }
    }

    static #write(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn("Storage write error", e);
        }
    }
}
