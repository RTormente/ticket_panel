import { ticketAction } from "/shared/js/api.js";

export async function executeTicketAction(type, action, value = null, channel = 0) {
    const payload = { type, action };

    if (action === "set") {
        payload.value = Number.isFinite(Number(value)) ? Number(value) : 0;
    }

    return ticketAction(payload, channel);
}
