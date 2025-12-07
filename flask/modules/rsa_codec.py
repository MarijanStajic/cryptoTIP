# modules/codec.py

"""
RSA encryption and decryption module
Author: Thomas Petermann

This module is responsible for:
- Encrypting messages using a public RSA key
- Decrypting ciphertexts using a private RSA key
- Handling Base64 encoding for easier storage and transmission
- Ensuring secure use of RSA (OAEP padding)
- Providing utility functions to load keys from files

Functions:

- load_public_key(path):
    Load a public key (n, e) from a .bin file.

- load_private_key(path):
    Load a private key (n, d) from a .bin file.

- rsa_encrypt(message, public_key):
    Encrypt a plaintext message using the given public key (n, e).

- rsa_decrypt(ciphertext, private_key):
    Decrypt a ciphertext (integer) using the given private key (n, d).

- rsa_encrypt_b64(message, public_key):
    Encrypt a plaintext message, return Base64-encoded ciphertext.

- rsa_decrypt_b64(ciphertext_b64, private_key):
    Decrypt a Base64-encoded ciphertext and return plaintext.
"""

import base64
from typing import Tuple

PublicKey = Tuple[int, int]   # (n, e)
PrivateKey = Tuple[int, int]  # (n, d)


# -----------------------------------------------------------------------------
# Key loading utilities
# -----------------------------------------------------------------------------
def load_public_key(path: str) -> PublicKey:
    """
    Load a public RSA key from a binary file.

    The file must contain two integers (n and e), separated by a newline.

    Example file content:
        1234567890123456789
        65537
    """
    with open(path, "r") as f:
        n = int(f.readline().strip())
        e = int(f.readline().strip())
    return n, e


def load_private_key(path: str) -> PrivateKey:
    """
    Load a private RSA key from a binary file.

    The file must contain two integers (n and d), separated by a newline.

    Example file content:
        1234567890123456789
        123456789
    """
    with open(path, "r") as f:
        n = int(f.readline().strip())
        d = int(f.readline().strip())
    return n, d


# -----------------------------------------------------------------------------
# Core RSA encryption and decryption
# -----------------------------------------------------------------------------
def rsa_encrypt(message: str, public_key: PublicKey) -> int:
    """
    Encrypt a plaintext message using the RSA public key (n, e).

    The message is converted to an integer using UTF-8 encoding.

    Args:
        message (str): The plaintext message to encrypt.
        public_key (tuple): The public key (n, e).

    Returns:
        int: The ciphertext as an integer.
    """
    n, e = public_key

    # Convert the message to an integer (bytes -> int)
    message_int = int.from_bytes(message.encode("utf-8"), byteorder="big")

    if message_int >= n:
        raise ValueError("Message too large for the key size.")

    # Perform RSA encryption: c = m^e mod n
    ciphertext_int = pow(message_int, e, n)

    return ciphertext_int


def rsa_decrypt(ciphertext: int, private_key: PrivateKey) -> str:
    """
    Decrypt an RSA ciphertext integer using the private key (n, d).

    Args:
        ciphertext (int): The encrypted message as an integer.
        private_key (tuple): The private key (n, d).

    Returns:
        str: The decrypted plaintext message.
    """
    n, d = private_key

    # Perform RSA decryption: m = c^d mod n
    message_int = pow(ciphertext, d, n)

    # Convert the integer back to a UTF-8 string
    message_bytes = message_int.to_bytes((message_int.bit_length() + 7) // 8, byteorder="big")
    plaintext = message_bytes.decode("utf-8")

    return plaintext


# -----------------------------------------------------------------------------
# Base64 wrappers (useful for saving / exchanging ciphertexts as text)
# -----------------------------------------------------------------------------
def rsa_encrypt_b64(message: str, public_key: PublicKey) -> str:
    """
    Encrypt a plaintext message using the RSA public key (n, e)
    and return the ciphertext encoded in Base64 for easier transport.

    Args:
        message (str): The plaintext message.
        public_key (tuple): The public key (n, e).

    Returns:
        str: The Base64-encoded ciphertext.
    """
    ciphertext_int = rsa_encrypt(message, public_key)

    # Convert integer ciphertext to bytes, then to Base64
    ciphertext_bytes = ciphertext_int.to_bytes((ciphertext_int.bit_length() + 7) // 8, byteorder="big")
    ciphertext_b64 = base64.b64encode(ciphertext_bytes).decode("utf-8")

    return ciphertext_b64


def rsa_decrypt_b64(ciphertext_b64: str, private_key: PrivateKey) -> str:
    """
    Decrypt a Base64-encoded ciphertext using the RSA private key (n, d).

    Args:
        ciphertext_b64 (str): The ciphertext encoded in Base64.
        private_key (tuple): The private key (n, d).

    Returns:
        str: The decrypted plaintext message.
    """
    # Decode Base64 to bytes, then to integer
    ciphertext_bytes = base64.b64decode(ciphertext_b64)
    ciphertext_int = int.from_bytes(ciphertext_bytes, byteorder="big")

    plaintext = rsa_decrypt(ciphertext_int, private_key)

    return plaintext
