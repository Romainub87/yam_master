// backend/server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

// Créez un serveur HTTP
const server = http.createServer(app);

// Configurez le WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connecté');

    // Réception des messages du client
    ws.on('message', (message) => {
        console.log('Message reçu :', message);
        // Réponse au client
        ws.send(`Message reçu : ${message}`);
    });

    // Gestion de la déconnexion
    ws.on('close', () => {
        console.log('Client déconnecté');
    });
});

// Route de base
app.get('/', (req, res) => {
    res.send('Serveur WebSocket avec Express.js');
});

// Démarrage du serveur
server.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});