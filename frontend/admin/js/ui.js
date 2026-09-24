export default class UI {
    constructor() {
        this.el = {
            inNormalTicket: document.getElementById("inNormalTicket"),
            inPreferTicket: document.getElementById("inPreferTicket"),
            inVoiceList: document.getElementById("inVoiceList"),
            inVoiceRate: document.getElementById("inVoiceRate"),
            inVoicePitch: document.getElementById("inVoicePitch"),
            inToneDuration: document.getElementById("inToneDuration"),
            inToneCount: document.getElementById("inToneCount"),
            toneSequenceControls: document.getElementById("toneSequenceControls"),
            formSettingsPanel: document.getElementById("formSettingsPanel"),
            ulInfoShortcuts: document.getElementById("ulInfoShortcuts"),
            shortcutModal: document.getElementById("shortcutModal"),
            shortcutModalMessage: document.getElementById("shortcutModalMessage"),
            shortcutModalCancel: document.getElementById("shortcutModalCancel"),
            btnTestBeeper: document.getElementById("btnTestBeeper"),
            btnTestVoice: document.getElementById("btnTestVoice"),
            sltChannel: document.getElementById("sltChannel"),
            btnAddChannel: document.getElementById("btnAddChannel"),
            btnRemoveChannel: document.getElementById("btnRemoveChannel"),
            deleteChannelModal: document.getElementById("deleteChannelModal"),
            deleteChannelModalMessage: document.getElementById("deleteChannelModalMessage"),
            deleteChannelModalConfirm: document.getElementById("deleteChannelModalConfirm"),
            deleteChannelModalCancel: document.getElementById("deleteChannelModalCancel"),
            addChannelModal: document.getElementById("addChannelModal"),
            addChannelNumber: document.getElementById("addChannelNumber"),
            addChannelName: document.getElementById("addChannelName"),
            addChannelModalConfirm: document.getElementById("addChannelModalConfirm"),
            addChannelModalCancel: document.getElementById("addChannelModalCancel"),
        };

        this._listeners = [];
    }

    /* ===================================== */
    /* Tickets                               */
    /* ===================================== */

    updateTickets(normal, preferential) {
        if (this.el.inNormalTicket) {
            this.el.inNormalTicket.value = normal;
        }

        if (this.el.inPreferTicket) {
            this.el.inPreferTicket.value = preferential;
        }
    }

    /* ===================================== */
    /* Settings getters                      */
    /* ===================================== */

    getSelectedVoiceURI() {
        return this.el.inVoiceList?.value ?? null;
    }

    getVoiceRate() {
        return this.el.inVoiceRate?.value ?? null;
    }

    getVoicePitch() {
        return this.el.inVoicePitch?.value ?? null;
    }

    getToneDuration() {
        return this.el.inToneDuration?.value ?? null;
    }

    getToneSequence(fallbackLength = 1) {
        const count = Math.min(
            Math.max(Number.parseInt(this.el.inToneCount?.value ?? fallbackLength, 10) || fallbackLength, 1),
            4,
        );
        const sequence = [];
        for (let i = 0; i < count; i++) {
            const el = document.getElementById(`inToneSequence-${i}`);
            const raw = Number.parseInt(el?.value ?? "1", 10);
            sequence.push(Math.min(Math.max((Number.isFinite(raw) ? raw : 1) - 1, 0), 13));
        }
        return sequence;
    }

    getTickets() {
        return {
            N: String(this.el.inNormalTicket.value).padStart(3, "0"),
            P: String(this.el.inPreferTicket.value).padStart(3, "0"),
        };
    }

    /* ===================================== */
    /* Settings setters                      */
    /* ===================================== */

    setVoiceRate(value) {
        if (this.el.inVoiceRate) {
            this.el.inVoiceRate.value = value;
        }
    }

    setVoicePitch(value) {
        if (this.el.inVoicePitch) {
            this.el.inVoicePitch.value = value;
        }
    }

    populateVoices(voices, selectedURI) {
        if (!this.el.inVoiceList) return;

        const select = this.el.inVoiceList;
        select.replaceChildren();

        const muteOption = document.createElement("option");
        muteOption.value = "mute";
        muteOption.textContent = "Mudo";
        select.appendChild(muteOption);
        voices.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = voice.name;
            select.appendChild(option);
        });

        select.value = selectedURI ?? "mute";
    }

    renderBeeperSettings({ duration, sequence } = {}, toneOptionCount = 0) {
        if (this.el.inToneDuration) {
            this.el.inToneDuration.value = duration;
        }

        if (this.el.inToneCount) {
            this.el.inToneCount.value = sequence.length;
        }

        if (!this.el.toneSequenceControls) return;

        const controls = sequence.map((toneIndex, index) => {
            const wrapper = document.createElement("label");
            const valueLabel = document.createElement("span");
            const input = document.createElement("input");

            wrapper.className = "toneControl";
            wrapper.textContent = `Tom ${index + 1}: `;

            valueLabel.className = "toneControlValue";
            valueLabel.textContent = `(${toneIndex + 1})`;

            input.type = "range";
            input.id = `inToneSequence-${index}`;
            input.dataset.toneIndex = String(index);
            input.min = "1";
            input.max = String(toneOptionCount);
            input.step = "1";
            input.value = String(toneIndex + 1);

            input.addEventListener("input", () => {
                valueLabel.textContent = `(${Number(input.value)})`;
            });

            wrapper.append(valueLabel, input);
            return wrapper;
        });

        this.el.toneSequenceControls.replaceChildren(...controls);
    }

    /* ===================================== */
    /* Shortcuts                             */
    /* ===================================== */

    renderShortcuts(shortcuts) {
        if (!this.el.ulInfoShortcuts) return;

        const items = shortcuts.map((shortcut) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            const label = document.createElement("span");

            item.dataset.action = shortcut.action ?? "";

            button.type = "button";
            button.className = "btnShortcutAction";
            button.dataset.action = shortcut.action ?? "";
            button.textContent = shortcut.display;

            label.textContent = shortcut.label;

            item.append(button, label);
            return item;
        });

        this.el.ulInfoShortcuts.replaceChildren(...items);
    }

    showShortcutModal(message) {
        if (!this.el.shortcutModal || !this.el.shortcutModalMessage) return;
        this.el.shortcutModalMessage.textContent = message;
        this.el.shortcutModal.classList.remove("hidden");
    }

    hideShortcutModal() {
        this.el.shortcutModal?.classList.add("hidden");
    }

    isShortcutModalOpen() {
        return Boolean(this.el.shortcutModal && !this.el.shortcutModal.classList.contains("hidden"));
    }

    /* ===================================== */
    /* Events                                */
    /* ===================================== */

    #registerListener(element, event, handler) {
        if (!element) return null;
        element.addEventListener(event, handler);
        return () => element.removeEventListener(event, handler);
    }

    onShortcutActionClick(callback) {
        const handler = (event) => {
            const button = event.target.closest("button.btnShortcutAction");
            if (!button) return;
            callback(button.dataset.action);
        };

        document.addEventListener("click", handler);
        this._listeners.push(() => document.removeEventListener("click", handler));
    }

    onShortcutModalCancel(callback) {
        const unsubscribe = this.#registerListener(this.el.shortcutModalCancel, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onSettingsChange(callback) {
        const unsubscribe = this.#registerListener(this.el.formSettingsPanel, "change", (event) =>
            callback(event.target),
        );
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onTicketsChange(callback) {
        const u1 = this.#registerListener(this.el.inNormalTicket, "change", (event) => callback(event.target));
        const u2 = this.#registerListener(this.el.inPreferTicket, "change", (event) => callback(event.target));
        if (u1) this._listeners.push(u1);
        if (u2) this._listeners.push(u2);
    }

    onReset(callback) {
        const handler = (event) => {
            event.preventDefault();
            callback();
        };
        const unsubscribe = this.#registerListener(this.el.formSettingsPanel, "reset", handler);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onSaveSettings(callback) {
        const handler = (event) => {
            event.preventDefault();
            callback();
        };
        const unsubscribe = this.#registerListener(this.el.formSettingsPanel, "submit", handler);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onTestBeeper(callback) {
        const unsubscribe = this.#registerListener(this.el.btnTestBeeper, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onTestVoice(callback) {
        const unsubscribe = this.#registerListener(this.el.btnTestVoice, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    /* ===================================== */
    /* Channels                              */
    /* ===================================== */

    populateChannels(channels, selectedNumber = 0) {
        if (!this.el.sltChannel) return;

        const select = this.el.sltChannel;
        // If caller provided a selectedNumber explicitly (arguments.length >= 2), prefer it.
        let current;
        if (arguments.length >= 2) {
            current = selectedNumber;
        } else {
            const rawValue = select.value;
            const parsed = Number.isFinite(Number.parseInt(rawValue, 10)) ? Number.parseInt(rawValue, 10) : NaN;
            current = Number.isFinite(parsed) ? parsed : selectedNumber;
        }

        select.replaceChildren();

        channels.forEach((ch) => {
            const option = document.createElement("option");
            option.value = String(ch.id);
            option.textContent = `[${ch.id}] - ${ch.channelName}`;
            select.appendChild(option);
        });

        const preferred = channels.find((ch) => ch.id === current) ?? channels[0];
        if (preferred) select.value = String(preferred.id);
    }

    getSelectedChannelId() {
        const num = Number.parseInt(this.el.sltChannel?.value, 10);
        return Number.isFinite(num) ? num : 0;
    }

    showDeleteChannelModal(channelLabel) {
        if (this.el.deleteChannelModalMessage) {
            this.el.deleteChannelModalMessage.textContent = `Tem certeza que deseja excluir o canal "${channelLabel}"? Esta ação não pode ser desfeita.`;
        }
        this.el.deleteChannelModal?.classList.remove("hidden");
    }

    hideDeleteChannelModal() {
        this.el.deleteChannelModal?.classList.add("hidden");
    }

    showAddChannelModal() {
        if (this.el.addChannelNumber) this.el.addChannelNumber.value = "";
        if (this.el.addChannelName) this.el.addChannelName.value = "";
        this.el.addChannelModal?.classList.remove("hidden");
        this.el.addChannelNumber?.focus();
    }

    hideAddChannelModal() {
        this.el.addChannelModal?.classList.add("hidden");
    }

    getAddChannelInput() {
        const number = Number.parseInt(this.el.addChannelNumber?.value, 10);
        const name = this.el.addChannelName?.value?.trim() ?? "";
        return { channelNumber: Number.isFinite(number) ? number : null, channelName: name };
    }

    onAddChannelClick(callback) {
        const unsubscribe = this.#registerListener(this.el.btnAddChannel, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onRemoveChannelClick(callback) {
        const unsubscribe = this.#registerListener(this.el.btnRemoveChannel, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onDeleteChannelConfirm(callback) {
        const unsubscribe = this.#registerListener(this.el.deleteChannelModalConfirm, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onDeleteChannelCancel(callback) {
        const unsubscribe = this.#registerListener(this.el.deleteChannelModalCancel, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onAddChannelConfirm(callback) {
        const unsubscribe = this.#registerListener(this.el.addChannelModalConfirm, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onAddChannelCancel(callback) {
        const unsubscribe = this.#registerListener(this.el.addChannelModalCancel, "click", callback);
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onChannelChange(callback) {
        const unsubscribe = this.#registerListener(this.el.sltChannel, "change", (e) =>
            callback(Number.parseInt(e.target.value, 10)),
        );
        if (unsubscribe) this._listeners.push(unsubscribe);
    }

    onFloatingIconClick() {
        document.querySelectorAll(".floatingIcon [data-panel-toggle]").forEach((icon) => {
            const handler = (e) => {
                const panel = e.currentTarget.closest(".floatingIcon");
                e.currentTarget.classList.toggle("fa-circle-xmark");
                panel?.classList.toggle("active");
                panel?.lastElementChild?.classList.toggle("hidden");
            };

            icon.addEventListener("click", handler);
            this._listeners.push(() => icon.removeEventListener("click", handler));
        });
    }

    destroy() {
        this._listeners.forEach((unsubscribe) => unsubscribe());
        this._listeners = [];
    }
}
