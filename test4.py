import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

base_url = "http://127.0.0.1:5000"
credentials = json.dumps({"username": "test5", "password": "abc"}).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(f"{base_url}/api/auth/register", data=credentials, headers=headers)
urllib.request.urlopen(req, context=ctx)

req = urllib.request.Request(f"{base_url}/api/auth/login", data=credentials, headers=headers)
response = urllib.request.urlopen(req, context=ctx)
token = json.loads(response.read().decode('utf-8'))["token"]

headers['Authorization'] = f"Bearer {token}"
payload = json.dumps({"playerName": "LeBron James", "season": "2023-24"}).encode('utf-8')
req = urllib.request.Request(f"{base_url}/api/nba/player/perSeasonStats", data=payload, headers=headers)
try:
    response = urllib.request.urlopen(req, context=ctx)
    print(response.getcode())
    print(response.read().decode('utf-8')[:500])
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8')[:500])
