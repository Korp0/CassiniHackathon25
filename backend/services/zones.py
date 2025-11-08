import json, os

ZONES_PATH = os.path.join(os.path.dirname(__file__), "quest_zones.json")

def load_zones():
    with open(ZONES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def find_zone_by_code(code: str):
    zones = load_zones()
    for z in zones:
        if z["code"] == code:
            return z
    return None
