# modules/rsa_keys.py

"""
RSA key management module
Author: Thomas Petermann

This module is responsible for:
- Generating RSA key pairs (public and private keys)
- Ensuring that the public exponent 'e' is coprime with phi(n)
- Computing the private exponent 'd' using the modular inverse
- Storing keys locally in .bin files (never sending the private key elsewhere)
- Loading existing keys from disk if they already exist

Functions:

- generate_keypair(bits):
    Generate a new RSA key pair of the given bit size.

- keys_exist(user_id, directory="keys"):
    Check whether key files for the given user already exist on disk.

- save_keys(user_id, public_key, private_key, directory="keys"):
    Save the public and private keys to .bin files.

- load_keys(user_id, directory="keys"):
    Load the public and private keys from .bin files.

- get_or_create_keys(user_id, bits=512, directory="keys"):
    Convenience function: load keys if they exist, otherwise generate and save them.
"""

import os
import rsa_math
from typing import Tuple

PublicKey = Tuple[int, int]   # (n, e)
PrivateKey = Tuple[int, int]  # (n, d)


def generate_keypair(bits: int) -> Tuple[PublicKey, PrivateKey]:
    """
    Generate an RSA key pair of the given bit size.

    Steps:
    - Generate two distinct prime numbers p and q.
    - Compute n = p * q.
    - Compute phi(n) = (p - 1) * (q - 1).
    - Choose a public exponent e such that gcd(e, phi(n)) == 1.
    - Compute the private exponent d as the modular inverse of e modulo phi(n).

    Returns:
        (public_key, private_key)
        where:
            public_key  = (n, e)
            private_key = (n, d)
    """
    if bits < 8:
        raise ValueError("Key size is too small; use at least 8 bits for testing.")

    # We split the bit size between p and q (roughly half-half)
    half_bits = bits // 2

    # Generate two distinct prime numbers
    p = rsa_math.generate_prime(half_bits)
    q = rsa_math.generate_prime(half_bits)
    while q == p:
        q = rsa_math.generate_prime(half_bits)

    n = p * q
    phi = (p - 1) * (q - 1)

    # Common public exponent choice
    e = 65537

    # If e is not coprime with phi, fall back to searching for another odd e
    if rsa_math.gcd(e, phi) != 1:
        e = 3
        while e < phi and rsa_math.gcd(e, phi) != 1:
            e += 2

        if rsa_math.gcd(e, phi) != 1:
            raise ValueError("Failed to find a suitable public exponent e.")

    # Compute the private exponent d as the modular inverse of e modulo phi(n)
    d = rsa_math.modinv(e, phi)

    public_key: PublicKey = (n, e)
    private_key: PrivateKey = (n, d)

    return public_key, private_key


def _get_key_paths(user_id: str, directory: str = "keys") -> Tuple[str, str]:
    """
    Internal helper to build file paths for the user's key files.

    Returns:
        (public_key_path, private_key_path)
    """
    os.makedirs(directory, exist_ok=True)
    public_path = os.path.join(directory, f"{user_id}_public.bin")
    private_path = os.path.join(directory, f"{user_id}_private.bin")
    return public_path, private_path


def keys_exist(user_id: str, directory: str = "keys") -> bool:
    """
    Check if key files already exist for the given user_id.

    Returns:
        True if both public and private key files are present, False otherwise.
    """
    public_path, private_path = _get_key_paths(user_id, directory)
    return os.path.isfile(public_path) and os.path.isfile(private_path)


def save_keys(
    user_id: str,
    public_key: PublicKey,
    private_key: PrivateKey,
    directory: str = "keys",
) -> None:
    """
    Save the public and private keys to .bin files on disk.

    The keys are stored in a simple text-based format:
        public:  "n\n e\n"
        private: "n\n d\n"

    Even if the extension is .bin, the content is plain text for simplicity
    and easier debugging. This is acceptable for an educational project.
    """
    public_path, private_path = _get_key_paths(user_id, directory)
    n_pub, e = public_key
    n_priv, d = private_key

    # For RSA, n should be the same in both keys
    if n_pub != n_priv:
        raise ValueError("Public and private keys do not share the same modulus n.")

    # Write public key
    with open(public_path, "w", encoding="utf-8") as f_pub:
        f_pub.write(f"{n_pub}\n{e}\n")

    # Write private key (never shared)
    with open(private_path, "w", encoding="utf-8") as f_priv:
        f_priv.write(f"{n_priv}\n{d}\n")


def load_keys(user_id: str, directory: str = "keys") -> Tuple[PublicKey, PrivateKey]:
    """
    Load the public and private keys for the given user_id from .bin files.

    Returns:
        (public_key, private_key)

    Raises:
        FileNotFoundError if the key files do not exist.
        ValueError if the files are malformed.
    """
    public_path, private_path = _get_key_paths(user_id, directory)

    if not os.path.isfile(public_path) or not os.path.isfile(private_path):
        raise FileNotFoundError(f"No key files found for user '{user_id}'")

    # Read public key
    with open(public_path, "r", encoding="utf-8") as f_pub:
        lines_pub = [line.strip() for line in f_pub.readlines() if line.strip()]
    if len(lines_pub) < 2:
        raise ValueError(f"Invalid public key file format for user '{user_id}'")
    n_pub = int(lines_pub[0])
    e = int(lines_pub[1])

    # Read private key
    with open(private_path, "r", encoding="utf-8") as f_priv:
        lines_priv = [line.strip() for line in f_priv.readlines() if line.strip()]
    if len(lines_priv) < 2:
        raise ValueError(f"Invalid private key file format for user '{user_id}'")
    n_priv = int(lines_priv[0])
    d = int(lines_priv[1])

    if n_pub != n_priv:
        raise ValueError("Public and private key modulus (n) do not match.")

    public_key: PublicKey = (n_pub, e)
    private_key: PrivateKey = (n_priv, d)

    return public_key, private_key


def get_or_create_keys(
    user_id: str,
    bits: int = 64,
    directory: str = "keys",
) -> Tuple[PublicKey, PrivateKey]:
    """
    Convenience function for use by the Flask server.

    - If keys already exist on disk for this user_id, load and return them.
    - Otherwise:
        - generate a new key pair of the given size,
        - save them to .bin files,
        - and return them.

    This function ensures that:
    - each Flask instance (user) has a stable key pair across restarts,
    - the private key is always stored locally and never sent elsewhere.
    """
    if keys_exist(user_id, directory):
        return load_keys(user_id, directory)

    public_key, private_key = generate_keypair(bits)
    save_keys(user_id, public_key, private_key, directory)
    return public_key, private_key

