#!/usr/bin/env python3

from math import gcd
from hashlib import sha512
from Crypto.Util.Padding import pad, unpad
from Crypto.Util.number import long_to_bytes, getPrime, getRandomRange, inverse
from Crypto.Util.strxor import strxor as xor
from Crypto.Random import get_random_bytes


def exponents(size, phi, bits):
    p = []
    q = []
    for _ in range(size):
        pi = getPrime(bits)
        while gcd(pi, phi) != 1:
            pi = getPrime(bits)
        qi = inverse(pi, phi)
        p.append(pi)
        q.append(qi)
    return (p, q)


def get_coprime(vals, phi, bits):
    rand = 2
    notfound = True
    while notfound:
        rand = getPrime(bits)
        if gcd(rand, phi) == 1:
            notfound = False
            for val in vals:
                if gcd(rand, val) != 1:
                    notfound = True
                    break
    return rand


def get_generator(N):
    while True:
        g = getRandomRange(3, N - 2)
        if gcd(g, N) == 1:
            return g


def get_pub_params(g, phi, N, x, k, priv_exp):
    du = 1
    for q in priv_exp:
        du *= q
        du %= phi
    Du = pow(g, du, N)
    Y = pow(g, x, N)
    R = pow(g, k, N)
    return (Du, Y, R)


class ABE:

    def __init__(self, attributes):
        self.bits = 512
        self.attributes = attributes
        self.setup()

    def setup(self):
        p = getPrime(self.bits)
        q = getPrime(self.bits)

        N = p * q
        phi = (p - 1) * (q - 1)

        (pub_exp, priv_exp) = exponents(len(self.attributes), phi, self.bits)

        x = get_coprime(priv_exp, phi, self.bits)
        k = get_coprime(priv_exp, phi, self.bits)
        g = get_generator(N)

        (Du, Y, R) = get_pub_params(g, phi, N, x, k, priv_exp)

        self.pub_params = (N, Du, Y, R, pub_exp)
        self.priv_params = (x, k, p, q, priv_exp)

    def keygen(self, policies):
        (x, k, p, q, priv_exp) = self.priv_params
        phi = (p - 1) * (q - 1)

        da = 1
        for i in range(len(self.attributes)):
            if self.attributes[i] in policies:
                da *= priv_exp[i]
                da %= phi

        ru = getRandomRange(2, phi - 2)
        tu = getRandomRange(2, phi - 2)
        inverse_k = inverse(k, phi)
        su = (inverse_k * (da - x * ru) % phi) % phi

        k1 = su + x * tu
        k2 = (ru - k * tu) % phi

        return (k1, k2)

    def encrypt(self, policies, plaintext):
        (N, Du, Y, R, pub_exp) = self.pub_params

        s = get_random_bytes(64)
        rm = getRandomRange(2, N - 2)

        exp = 1
        for i in range(len(self.attributes)):
            if self.attributes[i] not in policies:
                exp *= pub_exp[i]
                exp %= N

        Km = pow(Du, rm * exp, N)

        Ym = pow(Y, rm, N)
        Rm = pow(R, rm, N)

        Cs = xor(sha512(long_to_bytes(Km)).digest(), s)

        padded = pad(plaintext, 64)
        Cm = xor(sha512(s).digest(), padded)

        return (policies, Ym, Rm, Cs, Cm)

    def decrypt(self, sk, ciphertext):
        (N, Du, Y, R, pub_exp) = self.pub_params
        (k1, k2) = sk
        (policies, Ym, Rm, Cs, Cm) = ciphertext

        exp = 1
        for i in range(len(self.attributes)):
            if not self.attributes[i] in policies:
                exp *= pub_exp[i]
                exp %= N

        Km = pow(pow(Ym, k2, N) * pow(Rm, k1, N), exp, N)

        s = xor(sha512(long_to_bytes(Km)).digest(), Cs)

        padded = xor(sha512(s).digest(), Cm)
        try:
            plaintext = unpad(padded, 64).decode()
        except:
            plaintext = "Invalid Padding"
        return plaintext
