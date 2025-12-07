# main.py
"""
Flask RSA encryption API
Author: Thomas Petermann

This Flask server acts as a local RSA engine for one user (A, B, etc.).
It exposes HTTP routes for:
- Publishing the user's public key
- Registering the peer's public key
- Encrypting and decrypting messages
"""

from flask import Flask, request, jsonify
import modules
from dotenv import load_dotenv
from flask_cors import CORS
import os

# ----------------------------
# Load environment variables
# ----------------------------
load_dotenv()
USER_ID = os.getenv("USER_ID", "A")
PORT = int(os.getenv("PORT", 5000))

# ----------------------------
# Initialize RSA keys
# ----------------------------
public_key, private_key = modules.rsa_keys.get_or_create_keys(USER_ID, bits=64)
peer_public_key = None

# ----------------------------
# Initialize Flask app
# ----------------------------
app = Flask(__name__)
CORS(app)

# ----------------------------
# Routes
# ----------------------------

@app.route("/health", methods=["GET"])
def health():
    """Simple health check."""
    return jsonify({"status": "ok", "user_id": USER_ID})


@app.route("/public_key", methods=["GET"])
def get_public_key():
    """Return this user's public key."""
    n, e = public_key
    return jsonify({
        "user_id": USER_ID,
        "public_key": {"n": str(n), "e": str(e)}
    })


@app.route("/set_peer_public_key", methods=["POST"])
def set_peer_public_key():
    """Save the peer's public key for encryption."""
    global peer_public_key
    data = request.get_json()
    try:
        n = int(data["public_key"]["n"])
        e = int(data["public_key"]["e"])
        peer_public_key = (n, e)
        return jsonify({"status": "peer public key set"})
    except Exception as err:
        return jsonify({"error": f"invalid key data: {err}"}), 400


@app.route("/encrypt", methods=["POST"])
def encrypt_message():
    """Encrypt a plaintext message using the peer's public key."""
    global peer_public_key
    if peer_public_key is None:
        return jsonify({"error": "Peer public key not set"}), 400

    data = request.get_json()
    plaintext = data.get("plaintext", "")

    try:
        ciphertext_b64 = modules.rsa_codec.rsa_encrypt_b64(plaintext, peer_public_key)
        return jsonify({"ciphertext": ciphertext_b64})
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@app.route("/decrypt", methods=["POST"])
def decrypt_message():
    """Decrypt a ciphertext message using the local private key."""
    data = request.get_json()
    ciphertext_b64 = data.get("ciphertext", "")

    try:
        plaintext = modules.rsa_codec.rsa_decrypt_b64(ciphertext_b64, private_key)
        return jsonify({"plaintext": plaintext})
    except Exception as err:
        return jsonify({"error": str(err)}), 500


# ----------------------------
# Run server
# ----------------------------
if __name__ == "__main__":
    print(f"Starting Flask RSA server for user {USER_ID} on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT)
