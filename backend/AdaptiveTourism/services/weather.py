import requests

def decode_weather(code: int):
    mapping = {
        0: "clear sky",
        1: "mainly clear",
        2: "partly cloudy",
        3: "overcast",
        45: "fog",
        48: "rime fog",
        51: "light drizzle",
        53: "moderate drizzle",
        55: "dense drizzle",
        61: "light rain",
        63: "moderate rain",
        65: "heavy rain",
        66: "freezing rain",
        67: "freezing rain",
        71: "light snow",
        73: "moderate snow",
        75: "heavy snow",
        80: "light rain showers",
        81: "moderate rain showers",
        82: "heavy rain showers",
        85: "snow showers",
        86: "heavy snow showers",
        95: "thunderstorm",
        96: "thunderstorm with hail",
        99: "thunderstorm with hail"
    }
    return mapping.get(code, "unknown")


def get_weather(lat, lon):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    try:
        r = requests.get(url, timeout=10)
        data = r.json().get("current_weather", {})
        code = data.get("weathercode", 0)
        data["condition_text"] = decode_weather(code)
        return data
    except Exception as e:
        print("Weather error:", e)
        return {"weathercode": 0, "temperature": 0, "condition_text": "unknown"}
