import { saveState } from "/shared/js/api.js";

export const DEFAULT_BEEP = {
    toneDuration: 500,
    toneSequence: [12, 8, 12],
};

export const DEFAULT_SPEECH = {
    voiceRate: 1.4,
    voicePitch: 0.9,
    selectedVoiceURI: navigator.userAgent.includes("Windows")
        ? "daniel"
        : navigator.userAgent.includes("Linux")
          ? "Brazil)+UniversalRobot"
          : "mute",
};

function getNumberValue(value, fallback) {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
}

function getIntegerValue(value, fallback) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}

export function readSettingsFromUI(ui, currentState) {
    const toneDuration = getIntegerValue(ui.getToneDuration(), currentState.toneDuration);
    const toneSequence = ui.getToneSequence(currentState.toneSequence.length);
    const voiceRate = getNumberValue(ui.getVoiceRate(), currentState.voiceRate);
    const voicePitch = getNumberValue(ui.getVoicePitch(), currentState.voicePitch);
    const selectedVoiceURI = ui.getSelectedVoiceURI() ?? currentState.selectedVoiceURI;

    return { toneDuration, toneSequence, voiceRate, voicePitch, selectedVoiceURI };
}

export async function saveSettings(settings, channel = 0) {
    return saveState(settings, channel);
}

export async function resetSettings(channel = 0) {
    return saveState({ ...DEFAULT_BEEP, ...DEFAULT_SPEECH }, channel);
}
