import { fetchChannels, createChannel, deleteChannel } from "/shared/js/api.js";

export { fetchChannels };

export async function addChannel(channelNumber, channelName) {
    return createChannel(channelNumber, channelName);
}

export async function removeChannel(id) {
    return deleteChannel(id);
}

export function formatChannelLabel(channel) {
    return `[${channel.id}] - ${channel.channelName}`;
}
