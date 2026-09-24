import Beeper from "/shared/js/beeper.js";
import Speech from "/shared/js/speech.js";
import { fetchState, fetchChannels } from "/shared/js/api.js";
import UI from "./ui.js";

const DEFAULTS = Object.freeze({
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
});

const POLLING_INTERVAL_MS = 2000;

const CHANNEL_STORAGE_KEY = "ticket_panel_selected_channel_client";

const ui = new UI();
const beeper = new Beeper({ toneSequence: DEFAULTS.toneSequence, toneDuration: DEFAULTS.toneDuration });
const speech = new Speech({
    voiceRate: DEFAULTS.voiceRate,
    voicePitch: DEFAULTS.voicePitch,
    voiceVolume: DEFAULTS.voiceVolume,
    selectedVoiceURI: DEFAULTS.selectedVoiceURI,
});

let currentState = null;
let pollTimeout = null;
let isDestroyed = false;
let activeChannel = 0;
let lastAnnouncedHistoryId = null;

function getLatestHistoryId(history = []) {
    const latest = getLatestHistoryEntry(history);
    return latest ? latest.id : null;
}

/* ===================================== */
/* URL channel                           */
/* ===================================== */

function getChannelFromURL() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("channel");
    const num = Number.parseInt(raw, 10);
    if (Number.isFinite(num)) return num;
    try {
        const stored = Number.parseInt(localStorage.getItem(CHANNEL_STORAGE_KEY), 10);
        return Number.isFinite(stored) ? stored : 0;
    } catch (e) {
        return 0;
    }
}

function setChannelInURL(channelId) {
    const url = new URL(window.location.href);
    url.searchParams.set("channel", String(channelId));
    window.history.replaceState(null, "", url.toString());
}

/* ===================================== */
/* Canais                                */
/* ===================================== */

async function loadAndPopulateChannels() {
    try {
        const channels = await fetchChannels();
        ui.populateChannels(channels, activeChannel);
    } catch (e) {
        console.warn(e);
    }
}

/* ===================================== */
/* Estado                                */
/* ===================================== */

function toFiniteNumber(value, fallback, { min = -Infinity, max = Infinity, integer = false } = {}) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    const normalized = integer ? Math.trunc(number) : number;
    return Math.min(Math.max(normalized, min), max);
}

function normalizeState(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
        throw new Error("Estado recebido em formato inválido");
    }

    return {
        normalTicket: toFiniteNumber(state.normalTicket, DEFAULTS.normalTicket, { min: 0, max: 999, integer: true }),
        preferentialTicket: toFiniteNumber(state.preferentialTicket, DEFAULTS.preferentialTicket, {
            min: 0,
            max: 999,
            integer: true,
        }),
        voiceRate: toFiniteNumber(state.voiceRate, DEFAULTS.voiceRate, { min: 0.5, max: 2 }),
        voicePitch: toFiniteNumber(state.voicePitch, DEFAULTS.voicePitch, { min: 0, max: 2 }),
        selectedVoiceURI:
            typeof state.selectedVoiceURI === "string" ? state.selectedVoiceURI : DEFAULTS.selectedVoiceURI,
        toneDuration: toFiniteNumber(state.toneDuration, DEFAULTS.toneDuration, { min: 50, max: 1000, integer: true }),
        toneSequence: Array.isArray(state.toneSequence) ? state.toneSequence : DEFAULTS.toneSequence,
        channelName: typeof state.channelName === "string" ? state.channelName : "",
        recentCalls: Array.isArray(state.recentCalls) ? state.recentCalls : [],
    };
}

function getLatestHistoryEntry(history = []) {
    if (!Array.isArray(history) || history.length === 0) return null;
    return history[0];
}

function isRepeatAnnouncement(history) {
    const latest = getLatestHistoryEntry(history);
    if (!latest || latest.id === lastAnnouncedHistoryId) return false;
    lastAnnouncedHistoryId = latest.id;
    return true;
}

function applySettings(state) {
    beeper.setDuration(state.toneDuration);
    beeper.setSequence(state.toneSequence);
    speech.setConfigs({ voiceRate: state.voiceRate, voicePitch: state.voicePitch, voiceVolume: 1 });
    speech.setSelectedVoiceURI(state.selectedVoiceURI);
}

async function announceChange(type, ticket) {
    ui.flash(type);
    await beeper.play();
    if (speech.canSpeak()) {
        await speech.speakTicket(type, ticket);
    }
}

async function loadState() {
    try {
        const nextState = normalizeState(await fetchState(activeChannel));

        if (!currentState) {
            currentState = nextState;
            lastAnnouncedHistoryId = getLatestHistoryId(nextState.recentCalls);
            applySettings(nextState);
            ui.updateChannelName(nextState.channelName);
            ui.updateHistory(nextState.recentCalls);
            ui.updateTickets(nextState.normalTicket, nextState.preferentialTicket);
            return;
        }

        const changes = [];
        if (nextState.normalTicket !== currentState.normalTicket) {
            changes.push({ type: "N", ticket: nextState.normalTicket });
        }
        if (nextState.preferentialTicket !== currentState.preferentialTicket) {
            changes.push({ type: "P", ticket: nextState.preferentialTicket });
        }

        const latestHistoryId = getLatestHistoryId(nextState.recentCalls);
        const isNewHistory = latestHistoryId !== null && latestHistoryId !== lastAnnouncedHistoryId;

        currentState = nextState;
        applySettings(nextState);
        ui.updateChannelName(nextState.channelName);
        ui.updateHistory(nextState.recentCalls);
        ui.updateTickets(nextState.normalTicket, nextState.preferentialTicket);

        for (const change of changes) {
            await announceChange(change.type, change.ticket);
        }

        if (isNewHistory) {
            const latestHistory = getLatestHistoryEntry(nextState.recentCalls);
            if (latestHistory) {
                await announceChange(latestHistory.type, latestHistory.ticket);
            }
            lastAnnouncedHistoryId = latestHistoryId;
        }
    } catch (error) {
        console.warn(error);
    }
}

async function pollState() {
    await loadState();
    if (!isDestroyed) {
        pollTimeout = window.setTimeout(pollState, POLLING_INTERVAL_MS);
    }
}

function switchChannel(channelId) {
    activeChannel = channelId;
    currentState = null;
    setChannelInURL(channelId);
    try {
        localStorage.setItem(CHANNEL_STORAGE_KEY, String(channelId));
    } catch (e) {
        /* ignore storage errors */
    }
}

/* ===================================== */
/* Inicialização                         */
/* ===================================== */

window.addEventListener("beforeunload", () => {
    isDestroyed = true;
    if (pollTimeout) clearTimeout(pollTimeout);
    speech.destroy();
    beeper.destroy();
    ui.destroy();
});

async function initialize() {
    activeChannel = getChannelFromURL();
    await loadAndPopulateChannels();
    ui.onChannelChange((num) => {
        switchChannel(num);
    });
    ui.onFloatingIconClick();
    pollState();
}

initialize();
