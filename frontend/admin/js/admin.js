import Beeper from "/shared/js/beeper.js";
import Speech from "/shared/js/speech.js";
import { fetchState } from "/shared/js/api.js";
import UI from "./ui.js";
import ShortcutManager from "./shortcut.js";
import { executeTicketAction } from "./tickets.js";
import { DEFAULT_BEEP, DEFAULT_SPEECH, readSettingsFromUI, saveSettings, resetSettings } from "./settings.js";
import { fetchChannels, addChannel, removeChannel, formatChannelLabel } from "./channels.js";

/* ===================================== */
/* Shortcuts — localStorage              */
/* ===================================== */

const SHORTCUT_STORAGE_KEY = "ticket_panel_shortcuts";

const DEFAULT_SHORTCUTS = {
    nextNormal: { key: "NumpadAdd", display: "+", label: "Próxima senha normal" },
    nextPreferential: { key: "NumpadComma", display: ".", label: "Próxima senha preferencial" },
    previousNormal: { key: "NumpadDivide", display: "/", label: "Voltar senha normal" },
    previousPreferential: { key: "NumpadMultiply", display: "*", label: "Voltar senha preferencial" },
    callNormal: { key: "NumpadSubtract", display: "-", label: "Repete senha normal" },
    callPreferential: { key: "NumpadDecimal", display: ",", label: "Repete senha preferencial" },
};

function loadShortcuts() {
    try {
        const raw = localStorage.getItem(SHORTCUT_STORAGE_KEY);
        const stored = raw ? JSON.parse(raw) : null;
        if (!stored || typeof stored !== "object") {
            return structuredClone(DEFAULT_SHORTCUTS);
        }
        return Object.entries(DEFAULT_SHORTCUTS).reduce((acc, [action, shortcut]) => {
            const s = stored[action];
            acc[action] = {
                key: typeof s?.key === "string" ? s.key : shortcut.key,
                display: typeof s?.display === "string" ? s.display : shortcut.display,
                label: shortcut.label,
            };
            return acc;
        }, {});
    } catch (e) {
        console.warn("Erro ao carregar atalhos locais", e);
        return structuredClone(DEFAULT_SHORTCUTS);
    }
}

function saveShortcuts(state) {
    try {
        localStorage.setItem(SHORTCUT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Erro ao salvar atalhos locais", e);
    }
}

/* ===================================== */
/* Instâncias                            */
/* ===================================== */

const CHANNEL_STORAGE_KEY = "ticket_panel_selected_channel_admin";

function loadStoredChannel() {
    try {
        const raw = localStorage.getItem(CHANNEL_STORAGE_KEY);
        const num = Number.parseInt(raw, 10);
        return Number.isFinite(num) ? num : 0;
    } catch (e) {
        return 0;
    }
}

function saveStoredChannel(id) {
    try {
        localStorage.setItem(CHANNEL_STORAGE_KEY, String(id));
    } catch (e) {
        /* ignore */
    }
}

const ui = new UI();
const beeper = new Beeper({ toneSequence: DEFAULT_BEEP.toneSequence, toneDuration: DEFAULT_BEEP.toneDuration });
const speech = new Speech({
    voiceRate: DEFAULT_SPEECH.voiceRate,
    voicePitch: DEFAULT_SPEECH.voicePitch,
    voiceVolume: 1,
    selectedVoiceURI: DEFAULT_SPEECH.selectedVoiceURI,
});
const shortcutManager = new ShortcutManager(loadShortcuts(), saveShortcuts);

let currentState = null;
let activeShortcutAction = null;
let shortcutCaptureHandler = null;
let channelList = [];
let pendingDeleteChannelId = null;

/* ===================================== */
/* Estado                                */
/* ===================================== */

function applySettings(state) {
    beeper.setDuration(state.toneDuration);
    beeper.setSequence(state.toneSequence);
    speech.setConfigs({ voiceRate: state.voiceRate, voicePitch: state.voicePitch, voiceVolume: 1 });
    speech.setSelectedVoiceURI(state.selectedVoiceURI);
}

function renderSettings(state) {
    ui.setVoiceRate(state.voiceRate);
    ui.setVoicePitch(state.voicePitch);
    ui.renderBeeperSettings({ duration: state.toneDuration, sequence: state.toneSequence }, 14);
    ui.populateVoices(speech.getVoiceList(), speech.getSelectedVoiceURI());
}

async function refreshState() {
    try {
        const channel = ui.getSelectedChannelId();
        const state = await fetchState(channel);
        currentState = state;
        applySettings(state);
        ui.updateTickets(state.normalTicket, state.preferentialTicket);
        renderSettings(state);
    } catch (e) {
        console.warn(e);
    }
}

async function handleTicketAction(type, action, value = null) {
    try {
        const channel = ui.getSelectedChannelId();
        const state = await executeTicketAction(type, action, value, channel);
        currentState = state;
        applySettings(state);
        ui.updateTickets(state.normalTicket, state.preferentialTicket);
        renderSettings(state);
    } catch (e) {
        console.warn(e);
    }
}

/* ===================================== */
/* Tickets                               */
/* ===================================== */

function setupTicketButtons() {
    const buttonMap = {
        btnNextNormal: () => handleTicketAction("N", "next"),
        btnPreviousNormal: () => handleTicketAction("N", "previous"),
        btnCallNormal: () => handleTicketAction("N", "call"),
        btnNextPreferential: () => handleTicketAction("P", "next"),
        btnPreviousPreferential: () => handleTicketAction("P", "previous"),
        btnCallPreferential: () => handleTicketAction("P", "call"),
    };

    Object.entries(buttonMap).forEach(([id, handler]) => {
        document.getElementById(id)?.addEventListener("click", handler);
    });
}

function handleTicketInputChange(target) {
    if (!currentState) return;

    if (target.id === "inNormalTicket") {
        handleTicketAction("N", "set", target.value);
    } else if (target.id === "inPreferTicket") {
        handleTicketAction("P", "set", target.value);
    }
}

/* ===================================== */
/* Configurações                         */
/* ===================================== */

function handleToneCountChange(target) {
    if (!currentState) return;

    const count = Math.min(Math.max(Number.parseInt(target.value, 10) || 1, 1), 4);
    const updated = [...currentState.toneSequence].slice(0, count);
    while (updated.length < count) updated.push(0);
    ui.renderBeeperSettings({ duration: currentState.toneDuration, sequence: updated }, 14);
}

function handleSettingsChange(target) {
    if (target.id === "inToneCount") {
        handleToneCountChange(target);
    }
}

async function handleSaveSettings() {
    if (!currentState) return;
    try {
        const channel = ui.getSelectedChannelId();
        await saveSettings(readSettingsFromUI(ui, currentState), channel);
        await refreshState();
    } catch (e) {
        console.warn(e);
    }
}

async function handleResetSettings() {
    try {
        const channel = ui.getSelectedChannelId();
        shortcutManager.setShortcuts(DEFAULT_SHORTCUTS);
        saveShortcuts(structuredClone(DEFAULT_SHORTCUTS));
        shortcutManager.render(ui);
        await resetSettings(channel);
        await refreshState();
    } catch (e) {
        console.warn(e);
    }
}

function handleTestBeeper() {
    const settings = readSettingsFromUI(ui, currentState ?? DEFAULT_BEEP);
    beeper.setDuration(settings.toneDuration);
    beeper.setSequence(settings.toneSequence);
    beeper.play();
}

async function handleTestVoice() {
    try {
        const state = await fetchState(ui.getSelectedChannelId());
        const settings = readSettingsFromUI(ui, currentState ?? { ...DEFAULT_SPEECH, ...DEFAULT_BEEP });
        speech.setConfigs({ voiceRate: settings.voiceRate, voicePitch: settings.voicePitch, voiceVolume: 1 });
        speech.setSelectedVoiceURI(settings.selectedVoiceURI);
        speech.speakTicket("N", String(state.normalTicket).padStart(3, "0"));
        speech.speakTicket("P", String(state.preferentialTicket).padStart(3, "0"));
    } catch (e) {
        console.warn(e);
    }
}

/* ===================================== */
/* Canais                                */
/* ===================================== */

async function loadChannels(selectedNumber = 0) {
    try {
        channelList = await fetchChannels();
        ui.populateChannels(channelList, selectedNumber);
    } catch (e) {
        console.warn(e);
    }
}

function setupChannelListeners() {
    ui.onChannelChange(() => {
        saveStoredChannel(ui.getSelectedChannelId());
        refreshState();
    });

    ui.onAddChannelClick(() => ui.showAddChannelModal());

    ui.onAddChannelCancel(() => ui.hideAddChannelModal());

    ui.onAddChannelConfirm(async () => {
        const { channelName } = ui.getAddChannelInput();

        if (!channelName) return;

        try {
            await addChannel(channelName);
            ui.hideAddChannelModal();
            await loadChannels();
        } catch (e) {
            console.warn(e);
        }
    });

    ui.onRemoveChannelClick(() => {
        const selectedId = ui.getSelectedChannelId();
        if (selectedId === 0) return; // canal 0 não pode ser excluído

        const channel = channelList.find((ch) => ch.id === selectedId);
        if (!channel) return;

        pendingDeleteChannelId = channel.id;
        ui.showDeleteChannelModal(formatChannelLabel(channel));
    });

    ui.onDeleteChannelCancel(() => {
        pendingDeleteChannelId = null;
        ui.hideDeleteChannelModal();
    });

    ui.onDeleteChannelConfirm(async () => {
        if (!pendingDeleteChannelId) return;
        const id = pendingDeleteChannelId;
        pendingDeleteChannelId = null;
        ui.hideDeleteChannelModal();

        try {
            await removeChannel(id);
            await loadChannels();
            await refreshState();
        } catch (e) {
            console.warn(e);
        }
    });
}

function setupSettingsListeners() {
    ui.onSettingsChange(handleSettingsChange);
    ui.onTicketsChange(handleTicketInputChange);
    ui.onSaveSettings(handleSaveSettings);
    ui.onReset(handleResetSettings);
    ui.onTestBeeper(handleTestBeeper);
    ui.onTestVoice(handleTestVoice);
}

/* ===================================== */
/* Atalhos                               */
/* ===================================== */

function cancelShortcutCapture() {
    if (shortcutCaptureHandler) {
        document.removeEventListener("keydown", shortcutCaptureHandler, true);
        shortcutCaptureHandler = null;
    }
    activeShortcutAction = null;
}

function setupShortcutCapture() {
    ui.onShortcutActionClick((action) => {
        if (!action) return;

        cancelShortcutCapture();
        activeShortcutAction = action;
        ui.showShortcutModal("Pressione a tecla que deseja atribuir para esta ação.");

        shortcutCaptureHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (!activeShortcutAction) return;

            if (event.code === "Escape") {
                ui.hideShortcutModal();
                cancelShortcutCapture();
                return;
            }

            const display =
                event.code === "Space" ? "Space" : event.key.length === 1 ? event.key.toUpperCase() : event.key;

            shortcutManager.updateShortcut(activeShortcutAction, { key: event.code, display });
            ui.hideShortcutModal();
            shortcutManager.render(ui);
            cancelShortcutCapture();
        };

        document.addEventListener("keydown", shortcutCaptureHandler, true);
    });

    ui.onShortcutModalCancel(() => {
        ui.hideShortcutModal();
        cancelShortcutCapture();
    });
}

const TICKET_ACTION_MAP = {
    nextNormal: ["N", "next"],
    nextPreferential: ["P", "next"],
    previousNormal: ["N", "previous"],
    previousPreferential: ["P", "previous"],
    callNormal: ["N", "call"],
    callPreferential: ["P", "call"],
};

function isEditableTarget(target) {
    return Boolean(target?.closest?.("input, select, textarea, button, [contenteditable='true']"));
}

function setupGlobalShortcuts() {
    document.addEventListener("keydown", (event) => {
        if (activeShortcutAction || ui.isShortcutModalOpen() || isEditableTarget(event.target)) return;

        const action = shortcutManager.findActionByKey(event.code);
        const mapping = action ? TICKET_ACTION_MAP[action] : null;

        if (mapping) {
            event.preventDefault();
            handleTicketAction(...mapping);
        }
    });
}

/* ===================================== */
/* Inicialização                         */
/* ===================================== */

speech.onVoicesChanged = () => {
    if (currentState) {
        ui.populateVoices(speech.getVoiceList(), speech.getSelectedVoiceURI());
    }
};

window.addEventListener("beforeunload", () => {
    speech.destroy();
    beeper.destroy();
    ui.destroy();
});

async function initialize() {
    shortcutManager.render(ui);
    setupTicketButtons();
    setupShortcutCapture();
    setupGlobalShortcuts();
    setupChannelListeners();
    setupSettingsListeners();
    ui.onFloatingIconClick();
    const stored = loadStoredChannel();
    await loadChannels(stored);
    await refreshState();
}

initialize();
