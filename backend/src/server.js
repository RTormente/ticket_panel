const path = require("path");
const express = require("express");

const db = require("./database/db");
const ticketsRoutes = require("./routes/tickets");
const channelsRoutes = require("./routes/channels");

const PROJECT_ROOT = require("path").resolve(process.cwd());
const FRONTEND_CLIENT = path.join(PROJECT_ROOT, "frontend", "client");
const FRONTEND_ADMIN = path.join(PROJECT_ROOT, "frontend", "admin");
const FRONTEND_SHARED = path.join(PROJECT_ROOT, "frontend", "shared");

const app = express();
app.use(express.json());

app.use(express.static(FRONTEND_CLIENT));

app.get("/", (req, res) => {
    res.sendFile(path.join(FRONTEND_CLIENT, "index.html"));
});

app.get(/^\/admin$/, (req, res) => {
    res.redirect(301, "/admin/");
});

app.use("/admin", express.static(FRONTEND_ADMIN));

app.get("/admin/", (req, res) => {
    res.sendFile(path.join(FRONTEND_ADMIN, "index.html"));
});

// Assets compartilhados
app.use("/shared", express.static(FRONTEND_SHARED));

// Rotas de API
app.use("/api/tickets", ticketsRoutes);
app.use("/api/channels", channelsRoutes);

// Erro 404
app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada" });
});

// Inicializar banco e iniciar servidor
db.initialize((err) => {
    if (err) {
        console.error("Falha ao inicializar banco de dados:", err);
        process.exit(1);
    }

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
        console.log(`✓ Painel: http://localhost:${PORT}/`);
        console.log(`✓ Admin: http://localhost:${PORT}/admin`);
        console.log(`✓ API: http://localhost:${PORT}/api/tickets`);
    });
});

// Graceful shutdown
process.on("SIGINT", () => {
    console.log("\nEncerrando servidor...");
    db.close((err) => {
        if (err) {
            console.error(err);
        }
        process.exit(0);
    });
});
