from nba_api.stats.endpoints import playergamelog
from nba_api.stats.static import players

try:
    player_dict = players.get_active_players()
    player = [p for p in player_dict if p['full_name'] == 'LeBron James'][0]
    log = playergamelog.PlayerGameLog(player_id=player['id'], season='2025-26', timeout=15)
    df = log.get_data_frames()[0]
    print(df.head())
except Exception as e:
    import traceback
    traceback.print_exc()
