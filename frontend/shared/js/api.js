const JSON_HEADERS = {
    "Content-Type": "application/json",
};

async function jsonRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
    }

    return response.json();
}

function ticketUrl(path, channel) {
    const num = Number.isFinite(Number(channel)) ? Number(channel) : 0;
    return `/api/tickets/${path}?channel=${num}`;
}

export async function fetchState(channel = 0) {
    return jsonRequest(ticketUrl("state", channel), { cache: "no-store" });
}

export async function saveState(payload, channel = 0) {
    return jsonRequest(ticketUrl("state", channel), {
        method: "PUT",
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
    });
}

export async function ticketAction(data, channel = 0) {
    if (data.action === "set") {
        const key = data.type === "P" ? "preferentialTicket" : "normalTicket";
        return saveState({ [key]: data.value }, channel);
    }

    if (data.action === "next") {
        return jsonRequest(ticketUrl(`advance/${data.type}`, channel), { method: "POST" });
    }

    if (data.action === "previous") {
        return jsonRequest(ticketUrl(`retreat/${data.type}`, channel), { method: "POST" });
    }

    if (data.action === "call") {
        return jsonRequest(ticketUrl(`call/${data.type}`, channel), { method: "POST" });
    }

    throw new Error(`Ação de senha inválida: ${data.action}`);
}

export async function resetState(channel = 0) {
    return jsonRequest(ticketUrl("reset", channel), { method: "POST" });
}

export async function fetchChannels() {
    return jsonRequest("/api/channels");
}

export async function createChannel(channelName) {
    return jsonRequest("/api/channels", {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ channelName }),
    });
}

export async function deleteChannel(id) {
    const response = await fetch(`/api/channels/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP ${response.status}: ${body}`);
    }
}
