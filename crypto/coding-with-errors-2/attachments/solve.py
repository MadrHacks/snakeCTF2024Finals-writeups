#!/usr/bin/env python3
from pwn import *
from galois import GF2
import numpy as np

n, k, t, m = [256, 96, 20, 8]
success_line = "Yep"

HOST = args.HOST if args.HOST else "localhost"
PORT = int(args.PORT) if args.PORT else 1337
SSL = args.SSL

def hex_to_bin(hex_word: str) -> str:
    return bin(int(hex_word, 16))[2:].zfill(n)


def bin_to_hex(bin_word: str) -> str:
    return hex(int(bin_word, 2))[2:]


def get_encrypted_token() -> GF2:
    io.sendlineafter(b"> ", b"2")
    io.recvuntil(b"token: ")
    encrypted_token = []
    encrypted_token.extend(hex_to_bin(io.recvline(False).decode()))
    return GF2(encrypted_token)


def get_pub_key() -> GF2:
    io.sendlineafter(b"> ", b"1")
    io.recvuntil(b"Key:\n")
    pub_key_rows = []
    for _ in range(k):
        tmp = []
        tmp.extend(hex_to_bin(io.recvline(False).decode()))
        pub_key_rows.append(tmp)

    return GF2(pub_key_rows)


def test_ciphertext(to_send: GF2) -> bool:
    io.sendlineafter(b"> ", b"3")
    io.sendlineafter(b"): ", bin_to_hex("".join([str(d) for d in to_send])).encode())
    res = io.recvline(False).decode()

    return success_line in res


def submit_token(token: GF2) -> None:
    io.sendlineafter(b"> ", b"4")
    io.sendlineafter(b"): ", bin_to_hex("".join([str(d) for d in token])).encode())
    io.recvuntil(b"flag: ")
    print(io.recvline(False).decode())


io = remote(HOST, PORT, ssl=SSL)

io.recvuntil(b"Submit token.\n")
pub_key = get_pub_key()
encrypted_token = get_encrypted_token()
positions = []
pub_key_rref = pub_key.row_reduce()

i, j = 0, 0
while len(positions) < k:
    while pub_key_rref[i][j] != 1:
        j += 1
    positions.append(j)
    i += 1

system_to_solve = []
for i in range(k):
    row = [0] * (k + 1)
    tmp = GF2(encrypted_token)

    if i < (k - 1):
        row[i], row[i + 1] = [GF2(1)] * 2
        p_i = positions[i]
        p_i_1 = positions[i + 1]
        tmp[p_i] += GF2(1)
        tmp[p_i_1] += GF2(1)

        if test_ciphertext(tmp):
            row[-1] = GF2(1)
        else:
            row[-1] = GF2(0)
    else:
        row[0], row[i - 1], row[i] = [GF2(1)] * 3
        row[-1] = GF2(0)

    system_to_solve.append(row)

system_to_solve = GF2(system_to_solve)
err_reduced = system_to_solve.row_reduce().T[-1]

if sum(err_reduced.tolist()) > t:
    err_reduced = GF2([1 - d for d in err_reduced.tolist()])

pub_key_reduced_col = []
encrypted_token_reduced_elements = []
for p in positions:
    pub_key_reduced_col.append(pub_key[:, p])
    encrypted_token_reduced_elements.append(encrypted_token[p])

pub_key_reduced = GF2(pub_key_reduced_col).T
encrypted_token_reduced = GF2(encrypted_token_reduced_elements)
encrypted_token_reduced_correct = encrypted_token_reduced + err_reduced
token = encrypted_token_reduced_correct @ np.linalg.inv(pub_key_reduced)
submit_token(token)