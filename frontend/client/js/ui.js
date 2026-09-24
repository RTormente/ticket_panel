export default class UI {
    constructor() {
        this.el = {
            ticketNormal: document.getElementById("ticketNormal"),
            ticketPreferential: document.getElementById("ticketPreferential"),
            slcChannel: document.getElementById("slcChannel"),
            channelName: document.getElementById("channelName"),
            historyTicketContainer: document.getElementById("historyTicketContainer"),
        };
        this._listeners = [];
    }

    updateChannelName(channelName) {
        if (!this.el.channelName) return;
        this.el.channelName.textContent = channelName || "Teste";
    }

    formatHistoryTimestamp(timestamp) {
        const date = new Date(timestamp.replace(" ", "T") + "Z");
        if (Number.isNaN(date.getTime())) {
            return "--/--/-- --:--";
        }

        return date
            .toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            })
            .replace(",", " ");
    }

    updateHistory(recentCalls = []) {
        if (!this.el.historyTicketContainer) return;

        this.el.historyTicketContainer.replaceChildren();

        if (!Array.isArray(recentCalls) || recentCalls.length === 0) {
            const emptyState = document.createElement("p");
            emptyState.className = "historyEmpty";
            emptyState.textContent = "Nenhuma chamada recente";
            this.el.historyTicketContainer.appendChild(emptyState);
            return;
        }

        const list = document.createElement("ul");
        list.className = "historyList";

        const entries = (Array.isArray(recentCalls) ? recentCalls : []).slice(0, 6);

        entries.forEach((entry) => {
            const item = document.createElement("li");
            item.className = "historyItem";

            const ticket = document.createElement("span");
            ticket.className = "historyTicket";
            ticket.textContent = `${entry?.type === "P" ? "P" : ""}${String(entry?.ticket ?? 0).padStart(3, "0")}`;

            const meta = document.createElement("span");
            meta.className = "historyMeta";
            meta.textContent = this.formatHistoryTimestamp(entry?.timestamp);

            item.appendChild(ticket);
            item.appendChild(meta);
            list.appendChild(item);
        });

        this.el.historyTicketContainer.appendChild(list);
    }

    updateTickets(normal, preferential) {
        if (this.el.ticketNormal) {
            this.el.ticketNormal.textContent = String(normal).padStart(3, "0");
        }

        if (this.el.ticketPreferential) {
            this.el.ticketPreferential.textContent = `P${String(preferential).padStart(3, "0")}`;
        }
    }

    flash(type) {
        const target = type === "P" ? this.el.ticketPreferential : this.el.ticketNormal;
        if (!target) return;

        target.classList.add("blink");
        setTimeout(() => target.classList.remove("blink"), 2000);
    }

    populateChannels(channels, selectedNumber = 0) {
        if (!this.el.slcChannel) return;

        const select = this.el.slcChannel;
        // If caller provided a selectedNumber explicitly, prefer it over existing select.value
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

    onChannelChange(callback) {
        const handler = (e) => {
            const num = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(num)) callback(num);
        };

        this.el.slcChannel?.addEventListener("change", handler);
        this._listeners.push(() => this.el.slcChannel?.removeEventListener("change", handler));
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
