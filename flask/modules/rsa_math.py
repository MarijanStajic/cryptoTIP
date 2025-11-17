# modules/rsa_math.py

"""
RSA math module
Author: Thomas Petermann

This module provides the core mathematical functions required for an RSA
implementation:

- gcd(a, b): compute the greatest common divisor of two integers
- extended_gcd(a, b): extended Euclidean algorithm (returns gcd and coefficients)
- modinv(a, m): modular inverse of a modulo m
- is_prime(n): primality test using simple trial division
- generate_prime(bits): generate a random prime number of a given bit size
- lcm(a, b): least common multiple of two integers
"""

import random
import math


def gcd(a: int, b: int) -> int:
    """
    Compute the greatest common divisor (GCD) of a and b.
    Uses the classical Euclidean algorithm.
    """
    while b != 0:
        a, b = b, a % b
    return a


def extended_gcd(a: int, b: int):
    """
    Extended Euclidean algorithm.

    Returns a tuple (g, x, y) such that:
        g = gcd(a, b)
        a * x + b * y = g
    """
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_gcd(b, a % b)
    x = y1
    y = x1 - (a // b) * y1
    return g, x, y


def modinv(a: int, m: int) -> int:
    """
    Compute the modular inverse of a modulo m.

    Returns x such that:
        (a * x) % m == 1

    Raises ValueError if the inverse does not exist
    (i.e. when gcd(a, m) != 1).
    """
    g, x, _ = extended_gcd(a, m)
    if g != 1:
        raise ValueError(f"No modular inverse exists for {a} modulo {m}")
    return x % m


def is_prime(n: int) -> bool:
    """
    Check if n is a prime number using simple trial division.

    This is not optimized for very large numbers, but is sufficient
    for educational purposes and moderate bit sizes.
    """
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0:
        return False

    limit = int(math.isqrt(n))
    for i in range(3, limit + 1, 2):
        if n % i == 0:
            return False
    return True


def generate_prime(bits: int) -> int:
    """
    Generate a random prime number with the given bit length.

    The function:
    - generates a random odd candidate with the highest bit set,
    - tests primality with is_prime,
    - repeats until a prime is found.
    """
    if bits < 2:
        raise ValueError("Number of bits must be at least 2")

    while True:
        # Generate a random odd candidate
        candidate = random.getrandbits(bits) | 1
        # Ensure the most significant bit is set so we really get 'bits' bits
        candidate |= (1 << (bits - 1))

        if is_prime(candidate):
            return candidate


def lcm(a: int, b: int) -> int:
    """
    Compute the least common multiple (LCM) of a and b.

    Uses the relation:
        lcm(a, b) = |a * b| / gcd(a, b)
    """
    if a == 0 or b == 0:
        return 0
    return abs(a * b) // gcd(a, b)