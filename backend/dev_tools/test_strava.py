from app.strava import get_access_token, safe_get, BASE_URL

token, _ = get_access_token()
d = safe_get(f"{BASE_URL}/activities/18278713904", token)
print("Detailed keys:", d.keys())
print("Calories:", d.get('calories'))
