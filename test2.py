import requests
base_url = "http://127.0.0.1:5000"
credentials = {"username": "test3", "password": "abc"}
requests.post(f"{base_url}/api/auth/register", json=credentials)
token = requests.post(f"{base_url}/api/auth/login", json=credentials).json()["token"]
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
payload = {"playerName": "LeBron James", "season": "2023-24", "seasonType": "Regular Season"}
res = requests.post(f"{base_url}/api/nba/player/advancedSeasonStats", json=payload, headers=headers, timeout=45)
print(res.status_code)
print(res.text[:500])
