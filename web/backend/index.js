// web/backend/index.js
// WebSocket relay server with simple user IDs and public key storage
// Author: Thomas Petermann

const express = require("express");
const http = require("http");
const cors = require("cors");
const WebSocket = require("ws");

const PORT = process.env.WS_PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "websocket-backend" });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// userId -> WebSocket
const socketsByUser = new Map();
// userId -> { n, e }
const publicKeys = new Map();

function safeParse(message) {
    try {
        return JSON.parse(message);
    } catch {
        return null;
    }
}

function log(...args) {
    console.log(...args);
}

wss.on("connection", (ws) => {
    log("Client connected");

    ws.on("message", (data) => {
        const msg = safeParse(data);
        if (!msg || !msg.type) {
            return;
        }

        switch (msg.type) {
            case "register": {
                const { userId } = msg;
                if (!userId) return;
                ws.userId = userId;
                socketsByUser.set(userId, ws);
                log(`[register] ${userId}`);
                break;
            }

            case "announcePublicKey": {
                const { userId, publicKey } = msg;
                if (!userId || !publicKey) return;
                publicKeys.set(userId, publicKey);
                log(`[announcePublicKey] from ${userId}`, publicKey);
                break;
            }

            case "requestPublicKey": {
                const { targetUserId } = msg;
                if (!targetUserId) return;
                const key = publicKeys.get(targetUserId) || null;
                log(
                    `[requestPublicKey] ${ws.userId} -> ${targetUserId}:`,
                    key ? "FOUND" : "NOT FOUND"
                );
                ws.send(
                    JSON.stringify({
                        type: "publicKey",
                        targetUserId,
                        publicKey: key
                    })
                );
                break;
            }

            case "sendMessage": {
                const { to, from, ciphertext } = msg;
                if (!to || !from || typeof ciphertext !== "string") return;

                const targetWs = socketsByUser.get(to);
                if (!targetWs) {
                    log(`[sendMessage] ${from} -> ${to}: user offline`);
                    ws.send(
                        JSON.stringify({
                            type: "deliveryStatus",
                            ok: false,
                            to,
                            reason: "user offline",
                        })
                    );
                    return;
                }

                log(`[sendMessage] ${from} -> ${to}: ciphertext length=${ciphertext.length}`);

                // Message forwarded to recipient (chiffré)
                targetWs.send(
                    JSON.stringify({
                        type: "message",
                        from,
                        ciphertext,
                    })
                );

                // Acknowledge to sender
                ws.send(
                    JSON.stringify({
                        type: "deliveryStatus",
                        ok: true,
                        to,
                    })
                );
                break;
            }


            default:
                log("Unknown message type:", msg.type);
        }
    });

    ws.on("close", () => {
        const userId = ws.userId;
        if (userId && socketsByUser.get(userId) === ws) {
            socketsByUser.delete(userId);
            log(`Client disconnected: ${userId}`);
        } else {
            log("Client disconnected (no userId)");
        }
    });
});

server.listen(PORT, () => {
    console.log(`WebSocket backend running on http://localhost:${PORT}`);
});
