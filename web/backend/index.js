const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = process.env.PORT || 3000;

// HTTP server
const server = http.createServer(app);

// WebSocket server attached to the HTTP server
const wss = new WebSocket.Server({ server });

// Serve static files from /public (the web UI)
app.use(express.static('public'));

// Simple health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'WebSocket server is running 🚀' });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🔌 New client connected');

    ws.on('message', (message) => {
        console.log('📩 Message received:', message.toString());

        // For now, just echo the message back to the client
        ws.send(`Echo: ${message}`);
    });

    ws.on('close', () => {
        console.log('❌ Client disconnected');
    });
});

// Start the server
server.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
});
