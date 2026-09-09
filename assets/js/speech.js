export default class Speech {
    constructor({
        voiceRate = 1.4,
        voicePitch = 0.9,
        voiceVolume = 1,
        selectedVoiceURI = null,
        voiceLang = navigator.language,
    } = {}) {
        this.voiceRate = voiceRate;
        this.voicePitch = voicePitch;
        this.voiceVolume = voiceVolume;

        this.selectedVoiceURI = selectedVoiceURI;
        this.voiceLang = voiceLang;

        this.voiceList = [];
        this.allVoices = [];

        this.onVoicesChanged = null;

        this._voicesChangedHandler = () => {
            if (!this._destroyed) {
                this._updateVoiceList();
            }
        };

        this._initialized = false;
        this._destroyed = false;
        this._initVoiceList();
    }

    _initVoiceList() {
        this.setVoiceList(window.speechSynthesis.getVoices());
        window.speechSynthesis.addEventListener("voiceschanged", this._voicesChangedHandler);
        this._initialized = true;
    }

    _updateVoiceList() {
        if (this._destroyed) {
            return;
        }

        const newVoices = window.speechSynthesis.getVoices();

        if (newVoices.length === 0) {
            return;
        }

        const previousCount = this.allVoices.length;
        this.setVoiceList(newVoices);

        if (this.allVoices.length > previousCount) {
            this.onVoicesChanged?.(this.voiceList);
        }
    }

    destroy() {
        if (this._destroyed) {
            return;
        }

        this._destroyed = true;

        if (this._initialized) {
            window.speechSynthesis.removeEventListener("voiceschanged", this._voicesChangedHandler);
            this._initialized = false;
        }

        window.speechSynthesis.cancel();
    }

    setVoiceList(voices = []) {
        this.allVoices = voices;

        this.voiceList = voices.filter((voice) => voice.lang === this.voiceLang);

        if (voices.length > 0) {
            this._validateSelectedVoiceURI();
        }
    }

    _findVoice(identifier) {
        if (!identifier || identifier === "mute") {
            return null;
        }

        let voice = this.allVoices.find((v) => v.voiceURI === identifier);

        if (voice) {
            return voice;
        }

        voice = this.allVoices.find((v) => v.name.toLowerCase().includes(identifier.toLowerCase()));

        return voice ?? null;
    }

    _getFallbackVoice() {
        return this.voiceList.find((voice) => voice.name.includes("Maria")) ?? this.voiceList[0] ?? null;
    }

    _validateSelectedVoiceURI() {
        if (!this.selectedVoiceURI || this.selectedVoiceURI === "mute") {
            return;
        }

        const voice = this._findVoice(this.selectedVoiceURI) ?? this._getFallbackVoice();

        this.selectedVoiceURI = voice?.voiceURI ?? null;
    }

    getVoiceList() {
        if (!this.selectedVoiceURI || this.selectedVoiceURI === "mute") {
            return this.voiceList;
        }

        const selectedVoice = this._findVoice(this.selectedVoiceURI);

        if (!selectedVoice) {
            return this.voiceList;
        }

        const alreadyIncluded = this.voiceList.some((voice) => voice.voiceURI === selectedVoice.voiceURI);

        if (alreadyIncluded) {
            return this.voiceList;
        }

        return [...this.voiceList, selectedVoice];
    }

    getSelectedVoiceURI() {
        if (this.selectedVoiceURI === "mute") {
            return "mute";
        }

        const voice = this._findVoice(this.selectedVoiceURI) ?? this._getFallbackVoice();

        return voice?.voiceURI ?? "mute";
    }

    setSelectedVoiceURI(uri) {
        this.selectedVoiceURI = uri;

        if (this.allVoices.length > 0) {
            this._validateSelectedVoiceURI();
        }
    }

    setConfigs({ voiceRate, voicePitch, voiceVolume } = {}) {
        if (voiceRate != null) {
            this.voiceRate = voiceRate;
        }

        if (voicePitch != null) {
            this.voicePitch = voicePitch;
        }

        if (voiceVolume != null) {
            this.voiceVolume = voiceVolume;
        }
    }

    canSpeak() {
        return this.getSelectedVoiceURI() !== "mute";
    }

    numberToWords(number) {
        const mapping = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];

        return String(number)
            .padStart(3, "0")
            .split("")
            .map((digit) => mapping[Number(digit)])
            .join(" ");
    }

    speak(text, selectedVoiceURI = null) {
        const voiceIdentifier = selectedVoiceURI ?? this.getSelectedVoiceURI();

        const voice = this._findVoice(voiceIdentifier);

        if (!voice) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const utter = new SpeechSynthesisUtterance(text);

            utter.voice = voice;
            utter.volume = this.voiceVolume;
            utter.pitch = this.voicePitch;
            utter.rate = this.voiceRate;

            utter.onend = () => resolve();
            utter.onerror = () => resolve();

            window.speechSynthesis.speak(utter);
        });
    }

    speakTicket(type, ticket, selectedVoiceURI = null) {
        const text = `Senha ${type === "P" ? "Preferencial" : ""} ${String(ticket).padStart(3, "0")}`.trim();

        return this.speak(text, selectedVoiceURI);
    }

    announceNumber(ticket, selectedVoiceURI = null) {
        return this.speak(this.numberToWords(ticket), selectedVoiceURI);
    }
}
