# Flask RSA Engine

## Description

This project is part of the **CryptoTIP** system.  
It provides a **local Flask server** acting as an **RSA cryptographic engine** for each user (A, B, C, etc.).

Each instance of the Flask server is responsible for:

- Generating and storing its **own RSA key pair**.  
- Providing its **public key** to other peers via HTTP.  
- Encrypting and decrypting messages locally through a **REST API**.  

The server is designed to be lightweight, modular, and independent from the central WebSocket infrastructure.  
It ensures that **private keys never leave the host machine**.

---

### Built with

- Python 3.12+
- Flask 3.1.2
- python-dotenv

---

## Getting Started

### Prerequisites

- Python 3.12 or higher  
- Git  
- A virtual environment (recommended: `venv`)

---

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/MarijanStajic/cryptoTIP.git
   cd cryptoTIP/flask
   ```

2. **Create and activate a virtual environment**
   - Windows:

     ```bash
     python -m venv venv
     .\venv\Scripts\Activate
     ```

   - Linux / macOS:

     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a file named `.env` in the `flask/` folder:

   ```bash
   USER_ID=A
   PORT=5000
   ```

---

## Deployment

### Run the Flask server

1. Start the RSA engine:

   ```bash
   python main.py
   ```

2. The server will start on:

   ```
   http://localhost:5000
   ```

3. Example console output:

   ```
   Starting Flask RSA server for user A on port 5000...
   * Running on http://127.0.0.1:5000
   ```

---

## API Reference

### `GET /health`

**Response:**

```json
{ "status": "ok", "user_id": "A" }
```

### `GET /public_key`

**Response:**

```json
{
  "user_id": "A",
  "public_key": { "n": "123456789...", "e": "65537" }
}
```

### `POST /set_peer_public_key`

**Body:**

```json
{ "public_key": { "n": "987654321...", "e": "65537" } }
```

**Response:**

```json
{ "status": "peer public key set" }
```

### `POST /encrypt`

**Body:**

```json
{ "plaintext": "Hello world" }
```

**Response:**

```json
{ "ciphertext": "APvZtKz4xR3lVnYq2xZ..." }
```

### `POST /decrypt`

**Body:**

```json
{ "ciphertext": "APvZtKz4xR3lVnYq2xZ..." }
```

**Response:**

```json
{ "plaintext": "Hello world" }
```

---

## Directory structure

```text
flask
├── keys/
│   ├── A_public.bin
│   └── A_private.bin
├── modules/
│   ├── __init__.py
│   ├── rsa_math.py
│   ├── rsa_keys.py
│   └── codec.py
├── .env
├── main.py
├── requirements.txt
└── README.md
```

---

## Collaborate

- Conventional commits: <https://www.conventionalcommits.org/en/v1.0.0/>
- Git Flow workflow: <https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow>

---

## Contact

**Thomas Petermann** — <Thomas.Petermann@eduvaud.ch>
