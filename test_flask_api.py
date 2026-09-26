import requests
import json

base_url = "http://127.0.0.1:5000"
credentials = {"username": "seattlesports", "password": "ssipassword123"}

# 1. Register/Login
requests.post(f"{base_url}/api/auth/register", json=credentials)
login_res = requests.post(f"{base_url}/api/auth/login", json=credentials)

if login_res.status_code != 200:
    print(f"Auth failed: {login_res.status_code} {login_res.text}")
    exit(1)

token = login_res.json()["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

print(f"Got Token: {token[:15]}...")

# 2. Test NBA Endpoint
payload = {"playerName": "LeBron James", "season": "2023-24", "seasonType": "Regular Season"}
res = requests.post(f"{base_url}/api/nba/player/advancedSeasonStats", json=payload, headers=headers)

if res.status_code != 200:
    print(f"NBA API Failed: {res.status_code} {res.url}")
    print(res.text)
else:
    print("NBA API Success!")
