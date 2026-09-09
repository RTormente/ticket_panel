export class TextToSpeech {
    #_DEFAULT_RATE = 1;
    #_DEFAULT_PITCH = 1;
    #_DEFAULT_VOLUME = 0.5;
    #_DEFAULT_LANG = "ALL";
    #rate;
    #pitch;
    #lang;
    #volume;
    #speech;
    #listVoices;
    #defaultVoice;
    #selectedVoice;
    #eventTarget;

    constructor(voice_config) {
        this.#speech = window.speechSynthesis;
        this.#eventTarget = new EventTarget();
        this.loadVoices();

        this.rate = voice_config.rate ? voice_config.rate : this.#_DEFAULT_RATE;
        this.pitch = voice_config.pitch ? voice_config.pitch : this.#_DEFAULT_PITCH;
        this.volume = voice_config.volume ? voice_config.volume : this.#_DEFAULT_VOLUME;
        this.lang = voice_config.lang ? voice_config.lang : this.#_DEFAULT_LANG;
        this.#setDefaultVoice(voice_config.default ? voice_config.default : this.listVoices[0]);
    }

    /******************************************/

    set rate(value) {
        if (!value) throw new Error("Obrigatório inserir um valor");
        if (Number.isNaN(Number.parseFloat(value))) throw new Error("Favor informar apenas números");
        if (value < 0.1 || value > 10) throw new Error("Valor fora da faixa de 0.1 e 10");

        this.#rate = value;
    }

    get rate() {
        return this.#rate;
    }

    set pitch(value) {
        if (!value) throw new Error("Obrigatório inserir um valor");
        if (Number.isNaN(Number.parseFloat(value))) throw new Error("Favor informar apenas números");
        if (value < 0 || value > 2) throw new Error("Valor fora da faixa de 0 e 2");

        this.#pitch = value;
    }

    get pitch() {
        return this.#pitch;
    }

    set lang(value) {
        const codeLangISO = ["af", "af-ZA", "ar", "ar-AE", "ar-BH", "ar-DZ", "ar-EG", "ar-IQ", "ar-JO", "ar-KW"];
        codeLangISO.push("af", "af-ZA", "ar", "ar-AE", "ar-BH", "ar-DZ", "ar-EG", "ar-IQ", "ar-JO", "ar-KW", "ar-LB");
        codeLangISO.push("ar-LY", "ar-MA", "ar-OM", "ar-QA", "ar-SA", "ar-SY", "ar-TN", "ar-YE", "az", "az-AZ", "be");
        codeLangISO.push("be-BY", "bg", "bg-BG", "bs-BA", "ca", "ca-ES", "cs", "cs-CZ", "cy", "cy-GB", "da", "da-DK");
        codeLangISO.push("de", "de-AT", "de-CH", "de-DE", "de-LI", "de-LU", "dv", "dv-MV", "el", "el-GR", "en");
        codeLangISO.push("en-AU", "en-BZ", "en-CA", "en-CB", "en-GB", "en-IE", "en-JM", "en-NZ", "en-PH", "en-TT");
        codeLangISO.push("en-US", "en-ZA", "en-ZW", "eo", "es", "es-AR", "es-BO", "es-CL", "es-CO", "es-CR", "es-DO");
        codeLangISO.push("es-EC", "es-ES", "es-GT", "es-HN", "es-MX", "es-NI", "es-PA", "es-PE", "es-PR", "es-PY");
        codeLangISO.push("es-SV", "es-UY", "es-VE", "et", "et-EE", "eu", "eu-ES", "fa", "fa-IR", "fi", "fi-FI", "fo");
        codeLangISO.push("fo-FO", "fr", "fr-BE", "fr-CA", "fr-CH", "fr-FR", "fr-LU", "fr-MC", "gl", "gl-ES", "gu");
        codeLangISO.push("gu-IN", "he", "he-IL", "hi", "hi-IN", "hr", "hr-BA", "hr-HR", "hu", "hu-HU", "hy", "hy-AM");
        codeLangISO.push("id", "id-ID", "is", "is-IS", "it", "it-CH", "it-IT", "ja", "ja-JP", "ka", "ka-GE", "kk");
        codeLangISO.push("kk-KZ", "kn", "kn-IN", "ko", "ko-KR", "kok", "kok-IN", "ky", "ky-KG", "lt", "lt-LT", "lv");
        codeLangISO.push("lv-LV", "mi", "mi-NZ", "mk", "mk-MK", "mn", "mn-MN", "mr", "mr-IN", "ms", "ms-BN", "ms-MY");
        codeLangISO.push("mt", "mt-MT", "nb", "nb-NO", "nl", "nl-BE", "nl-NL", "nn-NO", "ns", "ns-ZA", "pa", "pa-IN");
        codeLangISO.push("pl", "pl-PL", "ps", "ps-AR", "pt", "pt-BR", "pt-PT", "qu", "qu-BO", "qu-EC", "qu-PE", "ro");
        codeLangISO.push("ro-RO", "ru", "ru-RU", "sa", "sa-IN", "se", "se-FI", "se-NO", "se-SE", "sk", "sk-SK", "sl");
        codeLangISO.push("sl-SI", "sq", "sq-AL", "sr-BA", "sr-SP", "sv", "sv-FI", "sv-SE", "sw", "sw-KE", "syr");
        codeLangISO.push("syr-SY", "ta", "ta-IN", "te", "te-IN", "th", "th-TH", "tl", "tl-PH", "tn", "tn-ZA", "tr");
        codeLangISO.push("tr-TR", "tt", "tt-RU", "ts", "uk", "uk-UA", "ur", "ur-PK", "uz", "uz-UZ", "vi", "vi-VN");
        codeLangISO.push("xh", "xh-ZA", "zh", "zh-CN", "zh-HK", "zh-MO", "zh-SG", "zh-TW", "zu", "zu-ZA", "ALL");

        if (!value) throw new Error("Obrigatório inserir um valor");
        if (!codeLangISO.includes(value)) throw new Error("Favor informar apenas códigos de idiomas validos.");

        this.#lang = value;
    }

    get lang() {
        return this.#lang;
    }

    set volume(value) {
        if (!value) throw new Error("Obrigatório inserir um valor");
        if (Number.isNaN(Number.parseFloat(value))) throw new Error("Favor informar apenas números");
        if (value < 0 || value > 1) throw new Error("Valor fora da faixa de 0 e 1");

        this.#volume = value;
    }

    get volume() {
        return this.#volume;
    }

    #setDefaultVoice(value) {
        if (!value) throw new Error("Obrigatório inserir um objeto SpeechSynthesisVoice");
        if (!value instanceof SpeechSynthesisVoice)
            throw new Error("Favor informar apenas objetos SpeechSynthesisVoice");

        this.#defaultVoice = value;
    }

    get defaultVoice() {
        return this.#defaultVoice;
    }

    set selectedVoice(value) {
        if (!value) throw new Error("Obrigatório inserir um objeto SpeechSynthesisVoice");
        if (!value instanceof SpeechSynthesisVoice)
            throw new Error("Favor informar apenas objetos SpeechSynthesisVoice");

        for (let voice of listVoices) {
            if (voice === value) {
                this.#selectedVoice = value;
                return;
            }
        }
        throw new Error("Objeto não faz parte da lista compatível com o dispositivo");
    }

    get selectedVoice() {
        return this.#selectedVoice;
    }

    get listVoices() {
        return this.#listVoices;
    }

    /******************************************/

    addEventListener(eventType, listener) {
        this.#eventTarget.addEventListener(eventType, listener);
    }

    removeEventListener(eventType, listener) {
        this.#eventTarget.removeEventListener(eventType, listener);
    }

    #dispatchEvent(eventType) {
        const newEvent = new CustomEvent(eventType);

        this.#eventTarget.dispatchEvent(newEvent);
    }

    /******************************************/

    loadVoices() {
        this.#speech.addEventListener("voiceschanged", () => {
            if (this.lang == this.#_DEFAULT_LANG) {
                this.#listVoices = this.#speech.getVoices();
            } else {
                this.#listVoices = this.#speech.getVoices().filter((i) => {
                    return i.lang == this.lang;
                });
            }

            this.#dispatchEvent("voiceschanged");
        });
    }

    speech(text) {
        const synthesis = new SpeechSynthesisUtterance(text);

        synthesis.voice = this.#selectedVoice;
        synthesis.volume = this.#volume;
        synthesis.pitch = this.#pitch;
        synthesis.rate = this.#rate;

        this.#speech.speak(synthesis);
    }
}
