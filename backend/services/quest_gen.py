import os
import json
import openai
from dotenv import load_dotenv
from services.weather import get_weather
from services.places import get_nearby_places

# === Setup ===
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


# === QUEST GENERATION ===
def generate_quest(place):
    """
    Generates a short AI-driven quest for a tourist visiting the given place.
    Always ensures valid JSON and correct indoor/outdoor logic.
    """
    prompt = f"""
    Create a short quest for a tourist visiting {place['name']} in Slovakia.

    Return only valid JSON (no extra text) with fields:
      place, goal, reward, educational_info, type, indoor_outdoor.

    Rules:
    - "place" → use the exact name of the location.
    - "goal" → short, motivational action for the visitor.
    - "reward" → an XP value like "20 XP" or "30 XP".
    - "educational_info" → 1 short factual or historical sentence.
    - "type" → must be one of: monument, museum, nature, church, castle, restaurant, hotel, park, landmark.
    - "indoor_outdoor" must follow:
        • indoor for museum, church, restaurant, hotel
        • outdoor for nature, park, castle, landmark, monument

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
        text = res.choices[0].message.content.strip()

        # Ensure we only parse JSON
        if text.startswith("```"):
            text = text.split("```")[-2] if "```" in text else text
        data = json.loads(text)

    except Exception as e:
        print("AI quest error:", e)
        # fallback quest
        data = {
            "place": place["name"],
            "goal": f"Explore {place['name']} and learn about its history.",
            "reward": "20 XP",
            "educational_info": "Local point of interest.",
            "type": "landmark",
            "indoor_outdoor": "outdoor"
        }

    # === Final post-processing ===
    data["lat"] = place.get("lat")
    data["lon"] = place.get("lon")

    # Normalize type
    data["type"] = str(data.get("type", "landmark")).strip().lower()
    valid_types = [
        "monument", "museum", "nature", "church",
        "castle", "restaurant", "hotel", "park", "landmark"
    ]
    if data["type"] not in valid_types:
        data["type"] = "landmark"

    # Enforce correct indoor/outdoor logic (overrides AI mistakes)
    indoor_types = ["museum", "church", "restaurant", "hotel"]
    outdoor_types = ["nature", "park", "castle", "landmark", "monument"]

    if data["type"] in indoor_types:
        data["indoor_outdoor"] = "indoor"
    elif data["type"] in outdoor_types:
        data["indoor_outdoor"] = "outdoor"
    else:
        data["indoor_outdoor"] = "outdoor"

    return data


# === AI RECOMMENDATION ===
def ai_recommendation(quest):
    """
    Generates a friendly motivational message based on the quest.
    """
    prompt = f"""
    You are a friendly travel AI. Based on the quest JSON below,
    write one short, fun sentence to inspire the user to complete it.

    Quest:
    {quest}

    Example output:
    "Perfect weather for exploring Spiš Castle today — let's earn 40 XP!"
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


# === WEATHER CHECK & RECOMMENDATION ===
def check_quest_weather_and_recommend(quest):
    """
    Checks current weather for a quest and, if bad, recommends an indoor alternative.
    """
    lat, lon = quest["lat"], quest["lon"]
    weather = get_weather(lat, lon)
    quest["weather"] = weather  # attach live weather info

    code = weather.get("weathercode", 0)
    condition = weather.get("condition_text", "unknown")

    bad_weather_codes = [3,
        61, 63, 65, 66, 67, 71, 73, 75,
        80, 81, 82, 85, 86, 95, 96, 99
    ]

    # 🌧️ If outdoor quest and bad weather → suggest indoor alternative
    if quest.get("indoor_outdoor") == "outdoor" and code in bad_weather_codes:
        nearby = get_nearby_places(lat, lon)
        indoor_places = [p for p in nearby if p["type"] in ["museum", "church", "restaurant", "hotel"]]

        if not indoor_places:
            return {
                "quest": quest,
                "is_okay": False,
                "reason": condition,
                "ai_message": f"The weather is {condition}, so it's not ideal for outdoor exploration at {quest['place']}.",
                "suggestion": None
            }

        # Pick first indoor place
        suggestion_place = indoor_places[0]

        # Generate quest for suggestion
        from services.quest_gen import generate_quest
        suggested_quest = generate_quest(suggestion_place)

        # Attach weather
        suggested_weather = get_weather(suggested_quest["lat"], suggested_quest["lon"])
        suggested_quest["weather"] = suggested_weather

        # AI message for suggestion
        prompt = f"""
        Weather in {quest['place']} is {condition}, not great for outdoors.
        Write a short sentence encouraging the user to visit {suggestion_place['name']} instead (it's indoors).
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

    # 🌤️ Otherwise, quest is fine
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
