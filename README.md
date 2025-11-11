# cryptoTIP

This project aims to build a WebSocket server designed to communicate with multiple Flask-based agents in order to create a private messaging platform. The system enables secure, real-time communication between devices while ensuring that message confidentiality is fully preserved.

The core objective is to design a platform capable of transmitting encrypted messages from one computer (A) to another (B) through a relay server. Importantly, the relay server never has access to the message content or to the encryption keys — all encryption and decryption operations are handled directly by the client devices themselves.
