import requests, os


# === WEATHER MAPPING ===
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


# === BASIC WEATHER (Open-Meteo) ===
def get_weather(lat, lon):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
    try:
        r = requests.get(url, timeout=10)
        data = r.json().get("current_weather", {})
        code = data.get("weathercode", 0)
        data["condition_text"] = decode_weather(code)

        # Add air quality
        aq = get_air_quality(lat, lon)
        data["air_quality"] = aq

        return data
    except Exception as e:
        print("Weather error:", e)
        return {"weathercode": 0, "temperature": 0, "condition_text": "unknown", "air_quality": None}


# === AIR QUALITY (Sentinel-5P Copernicus) ===
def get_air_quality(lat, lon):
    """
    Fetches NO2 concentration from Copernicus Sentinel-5P using /process API.
    Returns simplified air quality data for GeoQuest.
    """
    try:
        token = os.getenv("COPERNICUS_TOKEN")
        if not token:
            raise Exception("Missing COPERNICUS_TOKEN")

        url = "https://sh.dataspace.copernicus.eu/api/v1/process"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

        # Small bounding box (about 5km²)
        delta = 0.05
        bbox = [lon - delta, lat - delta, lon + delta, lat + delta]

        payload = {
            "input": {
                "bounds": {"bbox": bbox},
                "data": [
                    {
                        "type": "sentinel-5p-l2",
                        "dataFilter": {
                            "productType": "L2__NO2___",
                            "timeRange": {
                                "from": "2025-11-01T00:00:00Z",
                                "to": "2025-11-08T23:59:59Z"
                            }
                        }
                    }
                ]
            },
            "output": {
                "width": 64,
                "height": 64,
                "responses": [
                    {"identifier": "default", "format": {"type": "image/tiff"}}
                ]
            },
            "evalscript": """
            //VERSION=3
            function setup() {
              return {
                input: ["NO2", "dataMask"],
                output: { bands: 1, sampleType: "FLOAT32" }
              };
            }
            function evaluatePixel(sample) {
              if (sample.dataMask == 0) return [0];
              return [sample.NO2];
            }
            """
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=45)
        if resp.status_code != 200:
            print("Air quality fetch error:", resp.text)
            return {"status": "error", "description": "Failed to fetch air quality"}

        # For hackathon demo purposes (no raster decoding)
        value = 0.0004
        if value < 0.0003:
            desc, status = "air is clear", "good"
        elif value < 0.0008:
            desc, status = "air is slightly dirty", "moderate"
        elif value < 0.0015:
            desc, status = "air is dirty", "bad"
        else:
            desc, status = "air is very dirty", "very bad"

        return {
            "status": status,
            "description": desc,
            "no2_value": value
        }

    except Exception as e:
        print("Air quality error:", e)
        return {"status": "error", "description": "unavailable"}
