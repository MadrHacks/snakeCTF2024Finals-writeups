#!/usr/bin/env python3

from pwn import remote, args
import json
from binascii import unhexlify
from hashlib import sha512
from Crypto.Util.Padding import unpad
from Crypto.Util.number import long_to_bytes
from Crypto.Util.strxor import strxor as xor

r = remote(args.HOST, args.PORT, ssl=args.SSL)
if args.TEAM_TOKEN:
    r.sendlineafter(b"enter your team token: ", args.TEAM_TOKEN.encode())


def egcd(a, b):
    if a == 0:
        return 0, 1

    x1, y1 = egcd(b % a, a)
    x = y1 - (b // a) * x1
    y = x1

    return x, y


def compute_sk(sk1, sk2, pub_params, ciphertext):
    N = pub_params["N"]
    Ym = ciphertext["Ym"]
    Rm = ciphertext["Rm"]
    pub_exp = pub_params["pub_exp"]
    p1 = pub_exp[0]
    p2 = pub_exp[1]

    k11 = sk1["k1"]
    k12 = sk1["k2"]
    k21 = sk2["k1"]
    k22 = sk2["k2"]

    T1 = pow(Ym, k12, N) * pow(Rm, k11, N)
    T2 = pow(Ym, k22, N) * pow(Rm, k21, N)

    (a1, a2) = egcd(p1, p2)

    Km = (pow(T2, a1, N) * pow(T1, a2, N)) % N

    return Km


if __name__ == "__main__":
    r.recvuntil(b":\n")
    pub_params = json.loads(r.recvline(False).decode())

    r.recvuntil(b":\n")
    ciphertext = json.loads(r.recvline(False).decode())

    r.sendlineafter(b"> ", b"1")
    r.recvuntil(b": ")
    sk1 = json.loads(r.recvline(False).decode())
    r.sendlineafter(b"> ", b"2")
    r.recvuntil(b": ")
    sk2 = json.loads(r.recvline(False).decode())
    Km = compute_sk(sk1, sk2, pub_params, ciphertext)

    Cs = unhexlify(ciphertext["Cs"])
    s = xor(sha512(long_to_bytes(Km)).digest(), Cs)

    Cm = unhexlify(ciphertext["Cm"])
    padded = xor(sha512(s).digest(), Cm)
    try:
        flag = unpad(padded, 64).decode()
    except:
        flag = "WRONG"
    print(flag)

    r.close()
