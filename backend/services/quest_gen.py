import os, openai, json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


def generate_quest(place):
    prompt = f"""
    Create a short quest for a tourist visiting {place['name']} in Slovakia.
    Respond in JSON with fields:
      place, goal, reward, educational_info, and type.
    The "type" should be one of: monument, museum, nature, church, castle, restaurant, hotel, park, or landmark.
    Example:
    {{
      "place": "Spiš Castle",
      "goal": "Climb to the top tower for a panoramic view.",
      "reward": "50 XP",
      "educational_info": "Spiš Castle is one of the largest castle sites in Central Europe.",
      "type": "castle"
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

        # Ensure type is valid
        valid_types = ["monument", "museum", "nature", "church", "castle", "restaurant", "hotel", "park", "landmark"]
        if data.get("type") not in valid_types:
            data["type"] = "landmark"

        return data

    except Exception as e:
        print("AI quest error:", e)
        return {
            "place": place["name"],
            "goal": f"Explore {place['name']} and learn about its history.",
            "reward": "20 XP",
            "educational_info": "Local point of interest.",
            "type": "landmark",
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
