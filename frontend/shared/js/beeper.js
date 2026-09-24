export default class Beeper {
    static DEFAULT_SEQUENCE = [1];
    static DEFAULT_DURATION = 100;
    static TONES = [
        { freq: 440.0, detune: -100 },
        { freq: 440.0, detune: -75 },
        { freq: 523.25, detune: -100 },
        { freq: 523.25, detune: -75 },
        { freq: 523.25, detune: -50 },
        { freq: 659.25, detune: -100 },
        { freq: 659.25, detune: -75 },
        { freq: 659.25, detune: -50 },
        { freq: 783.99, detune: -100 },
        { freq: 783.99, detune: -75 },
        { freq: 880.0, detune: -100 },
        { freq: 880.0, detune: -75 },
        { freq: 1000.0, detune: -100 },
        { freq: 1000.0, detune: -75 },
    ];

    constructor(config = {}) {
        this.sequence = Array.isArray(config.toneSequence) ? [...config.toneSequence] : [...Beeper.DEFAULT_SEQUENCE];
        this.duration = config.toneDuration ?? Beeper.DEFAULT_DURATION;
        this.audioCtx = null;
    }

    setDuration(duration) {
        this.duration = Number.isFinite(Number(duration)) ? Number(duration) : this.duration;
    }

    setSequence(sequence) {
        if (!Array.isArray(sequence)) {
            return;
        }

        this.sequence = sequence.map((tone) => Number.isFinite(Number(tone)) ? Number(tone) : 0);
    }

    play(sequence = this.sequence, duration = this.duration) {
        return new Promise((resolve) => {
            if (!Array.isArray(sequence) || sequence.length === 0) {
                resolve();
                return;
            }

            let index = 0;

            const next = () => {
                if (index >= sequence.length) {
                    resolve();
                    return;
                }

                this.#playTone(sequence[index], duration);

                index++;

                setTimeout(next, duration);
            };

            next();
        });
    }

    getTonesList() {
        return Beeper.TONES.map((tone, index) => ({
            index,
            ...tone,
        }));
    }

    destroy() {
        if (this.audioCtx && this.audioCtx.state !== "closed") {
            this.audioCtx.close();
        }
    }

    #getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;

            if (!AudioContext) {
                return null;
            }

            this.audioCtx = new AudioContext();
        }

        return this.audioCtx;
    }

    #playTone(toneIndex, duration) {
        const tone = Beeper.TONES[toneIndex];

        if (!tone) {
            console.warn(`Tom inválido: ${toneIndex}`);
            return;
        }

        const audioCtx = this.#getAudioContext();

        if (!audioCtx) {
            return;
        }

        if (audioCtx.state === "suspended") {
            audioCtx.resume().catch(console.error);
        }

        const oscillator = audioCtx.createOscillator();

        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = tone.freq;
        oscillator.detune.value = tone.detune;

        gainNode.gain.value = 0.25;

        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };

        oscillator.start();

        oscillator.stop(audioCtx.currentTime + duration / 1000);
    }
}
