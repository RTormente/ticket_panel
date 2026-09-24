const express = require("express");
const TicketService = require("../services/ticketService");

const router = express.Router();

function handleError(res, err, fallbackMessage) {
    console.error(err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ error: statusCode === 500 ? fallbackMessage : err.message });
}

function channelId(req) {
    const raw = req.query.channel;
    const num = Number.parseInt(raw, 10);
    return Number.isFinite(num) ? num : 0;
}

/**
 * GET /api/tickets/state?channel=0
 */
router.get("/state", (req, res) => {
    TicketService.getState(channelId(req), (err, state) => {
        if (err) return handleError(res, err, "Erro ao obter estado");
        res.json(state);
    });
});

/**
 * PUT /api/tickets/state?channel=0
 */
router.put("/state", (req, res) => {
    TicketService.updateState(channelId(req), req.body, (err, nextState) => {
        if (err) return handleError(res, err, "Erro ao atualizar estado");
        res.json(nextState);
    });
});

/**
 * POST /api/tickets/advance/:type?channel=0
 */
router.post("/advance/:type", (req, res) => {
    const type = req.params.type;
    if (!["N", "P"].includes(type)) {
        return res.status(400).json({ error: "Tipo de senha inválido" });
    }
    TicketService.advanceTicket(channelId(req), type, (err, state) => {
        if (err) return handleError(res, err, "Erro ao avançar senha");
        res.json(state);
    });
});

/**
 * POST /api/tickets/retreat/:type?channel=0
 */
router.post("/retreat/:type", (req, res) => {
    const type = req.params.type;
    if (!["N", "P"].includes(type)) {
        return res.status(400).json({ error: "Tipo de senha inválido" });
    }
    TicketService.retreatTicket(channelId(req), type, (err, state) => {
        if (err) return handleError(res, err, "Erro ao retroceder senha");
        res.json(state);
    });
});

/**
 * POST /api/tickets/call/:type?channel=0
 */
router.post("/call/:type", (req, res) => {
    const type = req.params.type;
    if (!["N", "P"].includes(type)) {
        return res.status(400).json({ error: "Tipo de senha inválido" });
    }
    TicketService.callTicket(channelId(req), type, (err, state) => {
        if (err) return handleError(res, err, "Erro ao repetir chamada");
        res.json(state);
    });
});

/**
 * POST /api/tickets/reset?channel=0
 */
router.post("/reset", (req, res) => {
    TicketService.resetState(channelId(req), (err, state) => {
        if (err) return handleError(res, err, "Erro ao resetar estado");
        res.json(state);
    });
});

module.exports = router;
