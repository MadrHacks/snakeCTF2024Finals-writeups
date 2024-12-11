#!/usr/bin/env python3

from abe import ABE
import json
from binascii import hexlify

import os
import signal

TIMEOUT = 60

BITS = 1024
ATTRIBUTES = ["HACKER", "SNAKE"]
assert "FLAG" in os.environ
FLAG = os.environ["FLAG"].encode()


def main():
    print("WELCOME TESTER!!")
    print(
        "New ABE encryption method developed over by the company 'No pairing, No problem'\n"
    )

    schema = ABE(ATTRIBUTES)

    (N, Du, Y, R, pub_exp) = schema.pub_params
    public_params_json = json.dumps(
        {"N": N, "Du": Du, "Y": Y, "R": R, "pub_exp": pub_exp}
    )

    policies = ["HACKER", "SNAKE"]
    ciphertext = schema.encrypt(policies, FLAG)
    (policies, Ym, Rm, Cs, Cm) = ciphertext
    ciphertext_json = json.dumps(
        {
            "policies": policies,
            "Ym": Ym,
            "Rm": Rm,
            "Cs": hexlify(Cs).decode(),
            "Cm": hexlify(Cm).decode(),
        }
    )

    print(f"Here you have your public params:\n{public_params_json}")
    print(f"\nHere you have the ciphertext:\n{ciphertext_json}")

    for _ in range(10):
        choice = input(
            "\nWhat you want to do?\n(1) Generate a secret key for 'HACKER'\n(2) Generate a secret key for 'SNAKE'\n(3) Decrypt the flag\n(0) Exit\n> "
        )
        if choice == "1":
            (k1, k2) = schema.keygen(["HACKER"])
            sk = json.dumps({"k1": k1, "k2": k2})
            print(
                f"Here's your secret key: {sk}\nRemember to not share it with anyone!!"
            )
        elif choice == "2":
            (k1, k2) = schema.keygen(["SNAKE"])
            sk = json.dumps({"k1": k1, "k2": k2})
            print(
                f"Here's your secret key: {sk}\nRemember to not share it with anyone!!"
            )
        elif choice == "3":
            sk = json.loads(input("Tell me your secret"))
            plaintext = schema.decrypt((sk["k1"], sk["k2"]), ciphertext)
            print(f"Here's your plaintext: {plaintext}")
        else:
            break

    print("Session finished. See ya!")


if __name__ == "__main__":
    signal.alarm(TIMEOUT)
    main()
