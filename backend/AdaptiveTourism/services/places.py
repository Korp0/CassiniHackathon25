import requests

def get_nearby_places(lat, lon):
    query = f"""
    [out:json];
    node(around:5000,{lat},{lon})[tourism];
    out;
    """
    try:
        r = requests.post("https://overpass-api.de/api/interpreter", data={"data": query}, timeout=15)
        data = r.json().get("elements", [])
        places = []
        for p in data:
            tags = p.get("tags", {})
            name = tags.get("name")
            if name:
                places.append({
                    "name": name,
                    "lat": p["lat"],
                    "lon": p["lon"],
                    "type": tags.get("tourism", "unknown")
                })
        return places
    except Exception as e:
        print("Overpass error:", e)
        return []
