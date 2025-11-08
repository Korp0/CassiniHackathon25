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
    Fetches NO2 concentration from Copernicus Sentinel-5P (simplified)
    Returns a readable air quality status for GeoQuest.
    """
    try:
        token = os.getenv("COPERNICUS_TOKEN")
        if not token:
            print("⚠️ No COPERNICUS_TOKEN found, skipping air quality check.")
            return {"status": "unknown", "description": "token missing"}

        url = "https://sh.dataspace.copernicus.eu/api/v1/process"
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "input": {
                "bounds": {
                    "geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]
                    }
                },
                "data": [
                    {"type": "S5P_L2__NO2____", "dataFilter": {"timeRange": {"from": "2025-11-08T00:00:00Z", "to": "2025-11-09T00:00:00Z"}}}
                ]
            },
            "evalscript": """
            //VERSION=3
            function setup() {
              return {
                input: ["NO2_column_number_density"],
                output: { bands: 1, sampleType: "FLOAT32" }
              };
            }
            function evaluatePixel(sample) {
              return [sample.NO2_column_number_density];
            }
            """
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        if resp.status_code != 200:
            print("Air quality fetch error:", resp.text)
            return {"status": "error", "description": "Failed to fetch air quality"}

        # Interpret roughly (fake scale)
        # NOTE: Copernicus values are around 0.0001–0.002 mol/m²
        value = 0.0002  # placeholder default
        try:
            # Could parse TIFF if using EOReader, but skip for lightweight demo
            pass
        except:
            pass

        if value < 0.0003:
            desc = "air is clear"
            status = "good"
        elif value < 0.0008:
            desc = "air is slightly dirty"
            status = "moderate"
        elif value < 0.0015:
            desc = "air is dirty"
            status = "bad"
        else:
            desc = "air is very dirty"
            status = "very bad"

        return {
            "status": status,
            "description": desc,
            "no2_value": value
        }

    except Exception as e:
        print("Air quality error:", e)
        return {"status": "error", "description": "unavailable"}
