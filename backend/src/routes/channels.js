const express = require("express");
const ChannelService = require("../services/channelService");

const router = express.Router();

function handleError(res, err, fallbackMessage) {
    console.error(err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: statusCode === 500 ? fallbackMessage : err.message });
}

/**
 * GET /api/channels
 * Lista todos os canais ordenados por número
 */
router.get("/", (req, res) => {
    ChannelService.listChannels((err, channels) => {
        if (err) return handleError(res, err, "Erro ao listar canais");
        res.json(channels);
    });
});

/**
 * POST /api/channels
 * Cria um novo canal
 * Body: { channelNumber: number, channelName: string }
 */
router.post("/", (req, res) => {
    const { channelName } = req.body;

    ChannelService.createChannel(channelName, (err, channel) => {
        if (err) {
            return handleError(res, err, "Erro ao criar canal");
        }

        return res.status(201).json(channel);
    });
});

/**
 * DELETE /api/channels/:id
 * Remove um canal (exceto o canal 0)
 */
router.delete("/:id", (req, res) => {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: "ID de canal inválido" });
    }

    ChannelService.deleteChannel(id, (err) => {
        if (err) return handleError(res, err, "Erro ao excluir canal");
        res.status(204).end();
    });
});

module.exports = router;
