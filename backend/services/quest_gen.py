import os, openai, json
from dotenv import load_dotenv
from services.weather import get_weather
from services.places import get_nearby_places


load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


def generate_quest(place):
    prompt = f"""
    Create a short quest for a tourist visiting {place['name']} in Slovakia.
    Respond in JSON with fields:
      place, goal, reward, educational_info, type, and indoor_outdoor.
    The "type" should be one of: monument, museum, nature, church, castle, restaurant, hotel, park, or landmark.
    The "indoor_outdoor" must be "indoor" or "outdoor" depending on the activity type.
    Example:
    {{
      "place": "Spiš Castle",
      "goal": "Climb to the top tower for a panoramic view.",
      "reward": "50 XP",
      "educational_info": "Spiš Castle is one of the largest castle sites in Central Europe.",
      "type": "castle",
      "indoor_outdoor": "outdoor"
    }}
    """

    try:
        res = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        text = res.choices[0].message.content
        data = json.loads(text)

        # Attach coordinates
        data["lat"] = place.get("lat")
        data["lon"] = place.get("lon")

        # Ensure type validity
        valid_types = ["monument", "museum", "nature", "church", "castle", "restaurant", "hotel", "park", "landmark"]
        if data.get("type") not in valid_types:
            data["type"] = "landmark"

        # Ensure indoor/outdoor is consistent
        indoor_types = ["museum", "church", "restaurant", "hotel"]
        if data.get("type") in indoor_types:
            data["indoor_outdoor"] = "indoor"
        elif data.get("type") in ["nature", "park", "castle", "landmark", "monument"]:
            data["indoor_outdoor"] = "outdoor"
        else:
            data["indoor_outdoor"] = "outdoor"

        return data

    except Exception as e:
        print("AI quest error:", e)
        return {
            "place": place["name"],
            "goal": f"Explore {place['name']} and learn about its history.",
            "reward": "20 XP",
            "educational_info": "Local point of interest.",
            "type": "landmark",
            "indoor_outdoor": "outdoor",
            "lat": place.get("lat"),
            "lon": place.get("lon"),
        }


def ai_recommendation(quest):
    prompt = f"""
    You are a friendly travel AI. Based on the quest JSON below, write one sentence to inspire the user.
    Quest: {quest}
    Example output:
    "Looks like perfect weather for exploring Spiš Castle today! Let's earn 40 XP!"
    """
    try:
        res = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        return res.choices[0].message.content.strip()
    except Exception as e:
        print("AI rec error:", e)
        return "Your next adventure awaits!"


def check_quest_weather_and_recommend(quest):
    lat, lon = quest["lat"], quest["lon"]
    weather = get_weather(lat, lon)
    quest["weather"] = weather  # ✅ attach live weather

    code = weather.get("weathercode", 0)
    condition = weather.get("condition_text", "unknown")

    bad_weather_codes = [61, 63, 65, 66, 67, 71, 73, 75, 80, 81, 82, 85, 86, 95, 96, 99]

    # 🌧️ If weather bad and quest is outdoor
    if quest.get("indoor_outdoor") == "outdoor" and code in bad_weather_codes:
        nearby = get_nearby_places(lat, lon)
        indoor_places = [p for p in nearby if p["type"] in ["museum", "church", "restaurant", "hotel"]]

        if not indoor_places:
            return {
                "quest": quest,
                "is_okay": False,
                "reason": condition,
                "ai_message": f"The weather is {condition}, so it might not be ideal to explore {quest['place']} right now.",
                "suggestion": None
            }

        # Pick first indoor place
        suggestion_place = indoor_places[0]

        # 🔮 Generate full quest for that suggestion
        from services.quest_gen import generate_quest  # avoid circular import
        suggested_quest = generate_quest(suggestion_place)

        # Attach weather and multiplier to suggestion
        suggested_weather = get_weather(suggested_quest["lat"], suggested_quest["lon"])
        suggested_quest["weather"] = suggested_weather

        # Create AI message
        prompt = f"""
        Weather in {quest['place']} is {condition}, which isn't ideal for outdoors.
        Suggest one friendly sentence encouraging the user to visit {suggestion_place['name']} instead.
        """
        try:
            res = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            ai_msg = res.choices[0].message.content.strip()
        except Exception:
            ai_msg = f"Weather is {condition}. Consider visiting {suggestion_place['name']} indoors instead."

        return {
            "quest": quest,
            "is_okay": False,
            "reason": condition,
            "suggested_quest": suggested_quest,
            "ai_message": ai_msg
        }

    # 🌤️ Weather okay or quest indoors
    if quest.get("indoor_outdoor") == "indoor":
        ai_msg = f"The weather is {condition}, but no worries — {quest['place']} is indoors and perfect to visit now!"
    else:
        ai_msg = f"Weather looks good ({condition}) for visiting {quest['place']}!"

    return {
        "quest": quest,
        "is_okay": True,
        "reason": condition,
        "ai_message": ai_msg
    }

