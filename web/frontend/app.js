document.addEventListener("DOMContentLoaded", () => {
    let socket = null;
    let myPublicKey = null;

    let stepPeerKey = null;
    let stepCiphertext = null;
    let stepPlaintext = null;
    let stepTo = null;

    const keyResolvers = new Map();

    const chatLogEl = document.getElementById("chatLog");
    const techLogEl = document.getElementById("techLog");
    const wsUrlEl = document.getElementById("wsUrl");
    const flaskUrlEl = document.getElementById("flaskUrl");
    const userIdEl = document.getElementById("userId");
    const peerIdEl = document.getElementById("peerId");
    const messageInputEl = document.getElementById("messageInput");
    const connectBtn = document.getElementById("connectBtn");
    const connectWsOnlyBtn = document.getElementById("connectWsOnlyBtn");
    const sendBtn = document.getElementById("sendBtn");

    const resetStepsBtn = document.getElementById("resetStepsBtn");
    const stepRegisterBtn = document.getElementById("stepRegisterBtn");
    const stepLoadKeyBtn = document.getElementById("stepLoadKeyBtn");
    const stepAnnounceKeyBtn = document.getElementById("stepAnnounceKeyBtn");

    const stepRequestPeerKeyBtn = document.getElementById("stepRequestPeerKeyBtn");
    const stepSetPeerKeyBtn = document.getElementById("stepSetPeerKeyBtn");
    const stepEncryptBtn = document.getElementById("stepEncryptBtn");
    const stepSendCipherBtn = document.getElementById("stepSendCipherBtn");

    function fmtTime() {
        return new Date().toLocaleTimeString("fr-CH", { hour12: false });
    }

    function appendLine(el, line) {
        if (!el) return;
        const row = document.createElement("div");
        row.textContent = String(line).replace(/^[\r\n\s]+/, "");
        el.appendChild(row);
        el.scrollTop = el.scrollHeight;
    }

    function techDivider(label = "") {
        const line = label ? `──────── ${label} ────────` : "────────────────────────";
        appendLine(techLogEl, line);
    }

    function logTech(message) {
        appendLine(techLogEl, `[${fmtTime()}] ${message}`);
    }

    function logChat(message) {
        const row = document.createElement("div");
        row.textContent = String(message).replace(/^[\r\n\s]+/, "");
        chatLogEl.appendChild(row);
        chatLogEl.scrollTop = chatLogEl.scrollHeight;
    }

    function isConnected() {
        return socket && socket.readyState === WebSocket.OPEN;
    }

    function enableStepButtons(connected) {
        stepRegisterBtn.disabled = !connected;
        stepLoadKeyBtn.disabled = !connected;
        stepAnnounceKeyBtn.disabled = !connected;

        stepRequestPeerKeyBtn.disabled = !connected;
        stepSetPeerKeyBtn.disabled = true;
        stepEncryptBtn.disabled = true;
        stepSendCipherBtn.disabled = true;
    }

    function resetStepState() {
        stepPeerKey = null;
        stepCiphertext = null;
        stepPlaintext = null;
        stepTo = null;

        if (isConnected()) {
            stepSetPeerKeyBtn.disabled = true;
            stepEncryptBtn.disabled = true;
            stepSendCipherBtn.disabled = true;
            stepRequestPeerKeyBtn.disabled = false;
        } else {
            enableStepButtons(false);
        }

        techDivider("Reset steps");
    }

    async function ensureSocketOpen(wsUrl) {
        if (isConnected()) return;

        if (socket && socket.readyState === WebSocket.CONNECTING) {
            logTech("Already connecting...");
            return;
        }

        logTech(`Connecting to ${wsUrl} ...`);
        socket = new WebSocket(wsUrl);

        socket.addEventListener("open", () => {
            logTech("Connected to WebSocket server");
            enableStepButtons(true);
        });

        socket.addEventListener("message", async (event) => {
            let msg;
            try {
                msg = JSON.parse(event.data);
            } catch {
                logTech("Received non-JSON message");
                return;
            }

            if (msg.type === "message") {
                const flaskUrl = flaskUrlEl.value.trim();
                const ciphertext = msg.ciphertext;

                logTech(`Ciphertext received from ${msg.from} (length=${ciphertext.length})`);
                logTech(ciphertext);

                try {
                    const res = await fetch(`${flaskUrl}/decrypt`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ciphertext }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);

                    const data = await res.json();
                    logTech(`Decrypted message from ${msg.from}: ${data.plaintext}`);
                    logChat(`[${msg.from}] : ${data.plaintext}`);
                    techDivider("Receive complete");
                } catch (err) {
                    logTech(`Failed to decrypt via Flask: ${err.message || "Failed"}`);
                    techDivider("Receive failed");
                }
                return;
            }

            if (msg.type === "deliveryStatus") {
                if (msg.ok) {
                    logTech(`Message delivered to ${msg.to}`);
                    techDivider("Send complete");
                } else {
                    logTech(`Failed to deliver to ${msg.to}: ${msg.reason || "unknown reason"}`);
                    techDivider("Send failed");
                }
                return;
            }

            if (msg.type === "publicKey") {
                logTech(`Received public key for ${msg.targetUserId}: ${msg.publicKey ? "present" : "null"}`);

                const resolver = keyResolvers.get(msg.targetUserId);
                if (resolver) {
                    keyResolvers.delete(msg.targetUserId);
                    resolver(msg.publicKey || null);
                }
                return;
            }

            logTech(`Received: ${event.data}`);
        });

        socket.addEventListener("close", () => {
            logTech("Disconnected from server");
            techDivider("Disconnected");
            enableStepButtons(false);
        });

        socket.addEventListener("error", () => {
            logTech("WebSocket error");
            techDivider("WS error");
        });

        await new Promise((r) => setTimeout(r, 50));
    }

    function registerStep() {
        if (!isConnected()) return logTech("Not connected.");

        const userId = userIdEl.value.trim();
        if (!userId) return logTech("Missing userId.");

        socket.send(JSON.stringify({ type: "register", userId }));
        logTech(`Sent register as "${userId}"`);
        techDivider("Step done");
    }

    async function loadMyKeyStep() {
        if (!isConnected()) return logTech("Not connected.");

        const flaskUrl = flaskUrlEl.value.trim();
        if (!flaskUrl) return logTech("Missing flaskUrl.");

        try {
            const res = await fetch(`${flaskUrl}/public_key`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            myPublicKey = data.public_key || data.publicKey || null;

            if (!myPublicKey || !myPublicKey.n || !myPublicKey.e) {
                logTech("Invalid public key format from Flask.");
                techDivider("Step failed");
                return;
            }

            logTech(`Loaded public key from Flask (n length=${String(myPublicKey.n).length})`);
            techDivider("Step done");
        } catch (err) {
            logTech(`Failed to fetch public key from Flask: ${err.message || "Failed"}`);
            techDivider("Step failed");
        }
    }

    function announceMyKeyStep() {
        if (!isConnected()) return logTech("Not connected.");

        const userId = userIdEl.value.trim();
        if (!userId) return logTech("Missing userId.");
        if (!myPublicKey) return logTech("My public key not loaded yet.");

        socket.send(JSON.stringify({ type: "announcePublicKey", userId, publicKey: myPublicKey }));
        logTech("Announced public key to WebSocket server");
        techDivider("Connected");
    }

    function waitForPublicKey(targetUserId, timeoutMs = 5000) {
        return new Promise((resolve) => {
            const t = setTimeout(() => {
                keyResolvers.delete(targetUserId);
                resolve(null);
            }, timeoutMs);

            keyResolvers.set(targetUserId, (pk) => {
                clearTimeout(t);
                resolve(pk);
            });
        });
    }

    async function requestPeerKeyStep() {
        if (!isConnected()) return logTech("Not connected.");

        const to = peerIdEl.value.trim();
        if (!to) return logTech("Missing peerId.");

        socket.send(JSON.stringify({ type: "requestPublicKey", targetUserId: to }));
        logTech(`Requested public key for ${to} from WebSocket server`);

        stepTo = to;

        const pk = await waitForPublicKey(to);
        if (!pk) {
            logTech(`No public key found for ${to}`);
            techDivider("Peer key missing");
            return;
        }

        stepPeerKey = pk;
        logTech(`Peer public key stored for ${to}`);
        techDivider("Peer key ready");

        stepSetPeerKeyBtn.disabled = false;
        stepEncryptBtn.disabled = true;
        stepSendCipherBtn.disabled = true;
    }

    async function setPeerKeyStep() {
        if (!isConnected()) return logTech("Not connected.");

        const flaskUrl = flaskUrlEl.value.trim();
        if (!flaskUrl) return logTech("Missing flaskUrl.");
        if (!stepPeerKey || !stepTo) return logTech("No peer key stored (step 4 first).");

        try {
            const resSet = await fetch(`${flaskUrl}/set_peer_public_key`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public_key: stepPeerKey }),
            });
            if (!resSet.ok) throw new Error(`HTTP ${resSet.status}`);

            logTech(`Peer public key set in Flask for ${stepTo}`);
            techDivider("Peer key set");

            stepEncryptBtn.disabled = false;
            stepSendCipherBtn.disabled = true;
        } catch (err) {
            logTech(`Failed to set peer key in Flask: ${err.message || "Failed"}`);
            techDivider("Step failed");
        }
    }

    async function encryptStep() {
        if (!isConnected()) return logTech("Not connected.");

        const flaskUrl = flaskUrlEl.value.trim();
        const plaintext = messageInputEl.value;

        if (!flaskUrl) return logTech("Missing flaskUrl.");
        if (!stepTo) return logTech("Missing peer (step 4 first).");
        if (!plaintext) return logTech("Missing message.");

        try {
            const resEnc = await fetch(`${flaskUrl}/encrypt`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plaintext }),
            });
            if (!resEnc.ok) throw new Error(`HTTP ${resEnc.status}`);

            const encData = await resEnc.json();
            const ciphertext = encData.ciphertext;

            stepCiphertext = ciphertext;
            stepPlaintext = plaintext;

            logTech(`Ciphertext generated for ${stepTo} (length=${ciphertext.length})`);
            logTech(ciphertext);
            techDivider("Encrypt done");

            stepSendCipherBtn.disabled = false;
        } catch (err) {
            logTech(`Failed to encrypt via Flask: ${err.message || "Failed"}`);
            techDivider("Encrypt failed");
        }
    }

    function sendCipherStep() {
        if (!isConnected()) return logTech("Not connected.");

        const from = userIdEl.value.trim();
        if (!from) return logTech("Missing userId.");
        if (!stepTo) return logTech("Missing peer.");
        if (!stepCiphertext) return logTech("No ciphertext (step 6 first).");

        socket.send(JSON.stringify({ type: "sendMessage", from, to: stepTo, ciphertext: stepCiphertext }));
        logTech(`Sent encrypted message to ${stepTo}`);
        logChat(`[${from}] : ${stepPlaintext ?? ""}`);

        messageInputEl.value = "";

        stepCiphertext = null;
        stepPlaintext = null;

        techDivider("Waiting delivery");
    }

    async function connectFull() {
        const wsUrl = wsUrlEl.value.trim();
        const flaskUrl = flaskUrlEl.value.trim();
        const userId = userIdEl.value.trim();

        if (!wsUrl || !flaskUrl || !userId) {
            alert("Please enter WS URL, Flask URL and your user ID.");
            return;
        }

        await ensureSocketOpen(wsUrl);

        if (!isConnected()) return;

        registerStep();
        await loadMyKeyStep();
        announceMyKeyStep();
    }

    async function connectWsOnly() {
        const wsUrl = wsUrlEl.value.trim();
        const flaskUrl = flaskUrlEl.value.trim();
        const userId = userIdEl.value.trim();

        if (!wsUrl || !flaskUrl || !userId) {
            alert("Please enter WS URL, Flask URL and your user ID.");
            return;
        }

        await ensureSocketOpen(wsUrl);
    }

    async function sendFull() {
        if (!isConnected()) {
            alert("Not connected to WebSocket server.");
            return;
        }

        const from = userIdEl.value.trim();
        const to = peerIdEl.value.trim();
        const plaintext = messageInputEl.value;
        const flaskUrl = flaskUrlEl.value.trim();

        if (!from || !to) return alert("Please set your ID and the receiver ID.");
        if (!plaintext) return alert("Please enter a message.");
        if (!flaskUrl) return alert("Missing Flask URL.");

        socket.send(JSON.stringify({ type: "requestPublicKey", targetUserId: to }));
        logTech(`Requested public key for ${to} from WebSocket server`);

        const pk = await waitForPublicKey(to);
        if (!pk) {
            logTech(`No public key found for ${to}`);
            techDivider("Peer key missing");
            return;
        }

        try {
            const resSet = await fetch(`${flaskUrl}/set_peer_public_key`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public_key: pk }),
            });
            if (!resSet.ok) throw new Error(`HTTP ${resSet.status}`);
            logTech(`Peer public key set in Flask for ${to}`);
            techDivider("Peer key ready");

            const resEnc = await fetch(`${flaskUrl}/encrypt`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plaintext }),
            });
            if (!resEnc.ok) throw new Error(`HTTP ${resEnc.status}`);

            const encData = await resEnc.json();
            const ciphertext = encData.ciphertext;

            logTech(`Ciphertext generated for ${to} (length=${ciphertext.length})`);
            logTech(ciphertext);

            socket.send(JSON.stringify({ type: "sendMessage", from, to, ciphertext }));
            logTech(`Sent encrypted message to ${to}`);
            logChat(`[${from}] : ${plaintext}`);

            messageInputEl.value = "";
            techDivider("Waiting delivery");
        } catch (err) {
            logTech(`Failed to encrypt/send via Flask: ${err.message || "Failed"}`);
            techDivider("Encrypt/send failed");
        }
    }

    connectBtn.addEventListener("click", connectFull);
    connectWsOnlyBtn.addEventListener("click", connectWsOnly);
    sendBtn.addEventListener("click", sendFull);

    resetStepsBtn.addEventListener("click", resetStepState);
    stepRegisterBtn.addEventListener("click", registerStep);
    stepLoadKeyBtn.addEventListener("click", loadMyKeyStep);
    stepAnnounceKeyBtn.addEventListener("click", announceMyKeyStep);

    stepRequestPeerKeyBtn.addEventListener("click", requestPeerKeyStep);
    stepSetPeerKeyBtn.addEventListener("click", setPeerKeyStep);
    stepEncryptBtn.addEventListener("click", encryptStep);
    stepSendCipherBtn.addEventListener("click", sendCipherStep);

    enableStepButtons(false);
});
