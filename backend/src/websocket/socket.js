/**
 * WebSocket configuration for real-time updates
 * Pode ser usado futuramente para notificações em tempo real
 */

module.exports = function setupWebSocket(io) {
    io.on("connection", (socket) => {
        console.log("Cliente conectado:", socket.id);

        socket.on("disconnect", () => {
            console.log("Cliente desconectado:", socket.id);
        });
    });
};
