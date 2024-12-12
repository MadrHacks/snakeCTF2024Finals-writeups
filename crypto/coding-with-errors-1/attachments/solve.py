#!/usr/bin/env python3
from pwn import *
from galois import GF2
import numpy as np

n, k, t, m = [256, 96, 20, 8]
success_line = 'Yep'

HOST = args.HOST if args.HOST else "localhost"
PORT = int(args.PORT) if args.PORT else 1337
SSL = args.SSL

def hex_to_bin(hex_word:str) -> str:
    return bin(int(hex_word,16))[2:].zfill(n)
    

def bin_to_hex(bin_word:str) -> str:
    return hex(int(bin_word,2))[2:]


def get_encrypted_token() -> GF2:
    io.sendlineafter(b'> ', b'2')
    io.recvuntil(b'token: ')
    encrypted_token = []
    encrypted_token.extend(hex_to_bin(io.recvline(False).decode())) 
    return GF2(encrypted_token)


def get_pub_key() -> GF2:
    io.sendlineafter(b'> ', b'1')
    io.recvuntil(b'Key:\n')
    pub_key_rows = []
    for _ in range(k):
        tmp = []
        tmp.extend(hex_to_bin(io.recvline(False).decode()))
        pub_key_rows.append(tmp)
    
    return GF2(pub_key_rows)


def test_ciphertext(to_send:GF2) -> bool:
    io.sendlineafter(b'> ', b'3')
    io.sendlineafter(b'): ', bin_to_hex(''.join([str(d) for d in to_send])).encode())
    res = io.recvline(False).decode()

    return success_line in res


def submit_token(token:GF2) -> None:
    io.sendlineafter(b'> ', b'4')
    io.sendlineafter(b'): ', bin_to_hex(''.join([str(d) for d in token])).encode())
    io.recvuntil(b'flag: ')
    print(io.recvline(False).decode())



io = remote(HOST, PORT, ssl=SSL)

io.recvuntil(b"Submit token.\n")
pub_key = get_pub_key()
encrypted_token = get_encrypted_token()
positions = {}
pub_key_rref = pub_key.row_reduce()

i, j = 0, 0
while len(positions) < k:
    while pub_key_rref[i][j] != 1:
        j += 1
    positions[j] = GF2(0)
    i += 1

for p in positions:
    tmp = GF2(encrypted_token)
    tmp[p] += GF2(1)

    if test_ciphertext(tmp):
        positions[p] = GF2(1)

for p in positions:
    encrypted_token[p] += GF2(positions[p])

pub_key_reduced_col = []
encrypted_token_reduced_elements = []
for p in positions:
    pub_key_reduced_col.append(pub_key[:, p])
    encrypted_token_reduced_elements.append(encrypted_token[p])

pub_key_reduced = GF2(pub_key_reduced_col).T
encrypted_token_reduced = GF2(encrypted_token_reduced_elements)
token = encrypted_token_reduced @ np.linalg.inv(pub_key_reduced)
submit_token(token)