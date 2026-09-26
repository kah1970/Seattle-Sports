from nba_api.stats.static import players
from nba_api.stats.endpoints import playergamelog
import json

# 1. Find Lebron's ID
nba_players = players.get_players()
player_dict = [player for player in nba_players if player['full_name'] == 'LeBron James'][0]
player_id = player_dict['id']

print(f"Player ID: {player_id}")

try:
    # 2. Try fetching game logs for 2023-24
    logs = playergamelog.PlayerGameLog(player_id=player_id, season="2023-24", timeout=15)
    df = logs.get_data_frames()[0]

    print(f"Fetched {len(df)} rows")
    print(df.head(2).to_string())
except Exception as e:
    print(f"Error fetching stats: {e}")
