# Serveur Flask – Moteur RSA

The Flask server, for a given user (A, B, C, etc.), acts as an **RSA engine** and exposes a **local HTTP API** used by the frontend.

### It does

- **Generates RSA keys** for the user.  
- Keeps the **private key locally** (never sent elsewhere, stored as `.bin`).  
- Exposes the **public key** through an HTTP route.  
- Stores the **public keys of peers**.  
- **Encrypts** plaintext messages using the peer’s public key.  
- **Decrypts** ciphertext messages using the local private key.  

### It does not

- Handle any **WebSocket connections**.  
- Provide any **graphical interface**.  
- Store any **messages**.
