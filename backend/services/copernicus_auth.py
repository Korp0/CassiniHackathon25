import requests, os, time

TOKEN_CACHE = {"access_token": None, "expires_at": 0, "refresh_token": None}

def get_copernicus_token():
    """Get or refresh Copernicus Data Space access token."""
    if TOKEN_CACHE["access_token"] and time.time() < TOKEN_CACHE["expires_at"]:
        return TOKEN_CACHE["access_token"]

    refresh_token = TOKEN_CACHE.get("refresh_token")
    auth_url = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

    # ✅ Try to refresh existing token
    if refresh_token:
        r = requests.post(
            auth_url,
            data={
                "grant_type": "refresh_token",
                "client_id": os.getenv("COPERNICUS_CLIENT_ID"),
                "refresh_token": refresh_token,
            },
        )
        if r.ok:
            data = r.json()
            TOKEN_CACHE.update({
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token", refresh_token),
                "expires_at": time.time() + int(data.get("expires_in", 900))
            })
            return data["access_token"]

    # 🆕 Get new token with username/password
    r = requests.post(
        auth_url,
        data={
            "grant_type": "password",
            "client_id": os.getenv("COPERNICUS_CLIENT_ID"),
            "username": os.getenv("COPERNICUS_USERNAME"),
            "password": os.getenv("COPERNICUS_PASSWORD"),
        },
    )

    if not r.ok:
        raise Exception(f"Copernicus auth failed: {r.text}")

    data = r.json()
    TOKEN_CACHE.update({
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token"),
        "expires_at": time.time() + int(data.get("expires_in", 900))
    })

    return data["access_token"]
