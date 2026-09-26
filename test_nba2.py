from nba_api.stats.endpoints import playergamelog
from nba_api.stats.static import players
import json
import sys
from urllib3.exceptions import ReadTimeoutError

try:
    log = playergamelog.PlayerGameLog(player_id=2544, season='2025-26', timeout=15)
    df = log.get_data_frames()[0]
    result = df.to_dict(orient="records")
    with open('lebron_2025.json', 'w') as f:
        json.dump(result, f)
    print(f"Success! Fetched {len(result)} games")
except Exception as e:
    print(f"Failed: {type(e).__name__} - {str(e)}")
