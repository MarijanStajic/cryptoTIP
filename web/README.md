# CryptoTIP – Web Frontend (Technical Documentation)

This document describes **only the WEB frontend** of the CryptoTIP project.  
It is intended as a **technical and pedagogical reference**, inspired by server-side
technical documentation (Flask / backend).

The frontend is a **static client**:

- HTML + vanilla JavaScript
- Tailwind CSS compiled locally
- communicates with Flask (HTTP) and WebSocket servers
- fully functional **offline after installation**

---

## 1. Role of the frontend

The web frontend acts as:

- an orchestrator for cryptographic exchanges
- a pedagogical user interface
- a visualization tool for internal states and protocol steps

It performs **no cryptographic computation itself**:

- encryption/decryption is delegated to the Flask server
- message transport is handled by the WebSocket server

---

## 2. Logical architecture

```
[ Browser ]
     |
     |  HTTP (fetch)
     v
[ Flask RSA Server ]
     |
     |  WebSocket
     v
[ WebSocket Server ]
     |
     v
[ Other clients ]
```

The frontend:

- triggers protocol steps
- displays results and logs
- stores no private keys

---

## 3. Directory structure

```
web/
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── input.css
│   ├── styles.css
│   ├── tailwind.config.cjs
│   └── serve.cjs
│
└── package.json
```

### 3.1 index.html

- UI structure
- automatic and step-by-step buttons
- main panels:
  - connection
  - chat
  - technical logs

### 3.2 app.js

- full frontend logic
- automatic and step-by-step execution modes
- WebSocket and Flask communication
- no external JS dependencies

### 3.3 input.css

Tailwind entry file:

```css
@import "tailwindcss";
```

### 3.4 styles.css

- auto-generated CSS output
- must not be edited manually

### 3.5 tailwind.config.cjs

Defines files scanned by Tailwind:

```js
module.exports = {
  content: ["./index.html", "./app.js"],
  theme: { extend: {} },
  plugins: [],
};
```

### 3.6 serve.cjs

- minimal local HTTP server
- serves static frontend files
- no framework involved

---

## 4. Installation

⚠️ Internet access is required **only for this step**.

From the `web/` directory:

```bash
npm install
```

This installs:

- Tailwind CSS CLI
- build dependencies

---

## 5. Tailwind CSS build

### 5.1 Production build (offline use)

From `web/frontend`:

```bash
npx tailwindcss -i input.css -o styles.css --minify
```

This generates the CSS used by the frontend.

---

### 5.2 Development mode

```bash
npx tailwindcss -i input.css -o styles.css --watch
```

Automatically rebuilds CSS on HTML/JS changes.

---

## 6. Running the frontend

From `web/frontend`:

```bash
node serve.cjs
```

Open in browser:

```
http://localhost:3000
```

---

## 7. Operating modes

### 7.1 Automatic mode

Buttons:

- **Connect**
- **Send**

Each button runs the full protocol without interruption.

---

### 7.2 Step-by-step mode (pedagogical)

Each protocol phase can be triggered manually:

1. User registration
2. Load local public key
3. Announce public key
4. Request peer public key
5. Inject peer key into Flask
6. Encrypt message
7. Send ciphertext

Intermediate states are stored in frontend memory.

---

## 8. Technical logs

Logs:

- are timestamped
- grouped by logical actions
- separated by visual delimiters

They allow:

- protocol explanation
- debugging
- real-time flow inspection

---

## 9. OFFLINE mode

Once:

- `npm install` has been executed
- `styles.css` has been generated

The frontend:

- requires no Internet access
- operates entirely on a local network

---

## 10. Security constraints

- No private keys stored in the browser
- No persistent secrets
- No CDN or external runtime dependencies

---

## 11. Git considerations

Should not be committed:

- `node_modules/`
- `styles.css` (optional, depending on workflow)

---

## 12. Author

**Thomas Petermann**  
CryptoTIP – Web Frontend Technical Documentation
