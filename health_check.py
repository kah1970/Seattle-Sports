import requests
import time
try:
    headers={'User-Agent': 'Mozilla/5.0'}
    r = requests.get("https://stats.nba.com/stats/shotchartdetail", headers=headers, timeout=5)
    print("NBA API reached. Status:", r.status_code)
except Exception as e:
    print("Still timing out:", e)
