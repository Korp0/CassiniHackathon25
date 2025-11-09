from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse, StreamingResponse
from io import BytesIO
import qrcode
import os
from uuid import uuid4  # ✅ for quest IDs

# === Services ===
from services.places import get_nearby_places
from services.weather import get_weather
from services.quest_gen import generate_quest, ai_recommendation
from services.logic import choose_best_quest
from services.zones import find_zone_by_code, load_zones
from services.quest_gen import check_quest_weather_and_recommend
from utils.calc import haversine

# === Setup ===
app = FastAPI()
QR_DIR = "qr_codes"

# === CORS ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === MODELS ===
class Quest(BaseModel):
    lat: float
    lon: float
    place: str
    reward: str


class CompleteQuestRequest(BaseModel):
    quest: Quest
    current_lat: float
    current_lon: float


# === HELPERS ===
def get_weather_multiplier(code: int) -> float:
    """Return reward multiplier based on weather code."""
    if code in [0, 1, 2]:  # clear / partly cloudy
        return 1.0
    if code in [3]:  # overcast
        return 1.1
    if code in [45, 48]:  # fog
        return 1.2
    if code in [51, 53, 55]:  # drizzle
        return 1.2
    if code in [61, 63, 65, 80, 81, 82]:  # rain
        return 1.3
    if code in [66, 67]:  # freezing rain
        return 1.4
    if code in [71, 73, 75, 85, 86]:  # snow
        return 1.4
    if code in [95, 96, 99]:  # thunderstorms
        return 1.5
    return 1.0


# === ACHIEVEMENTS SYSTEM ===
achievements = [
    {
        "id": "walk_10km",
        "name": "Explorer on Foot",
        "description": "Walk a total of 10 km while exploring quests.",
        "reward_geobucks": 20,
    },
    {
        "id": "reach_lvl_5",
        "name": "Adventurer",
        "description": "Reach player level 5.",
        "reward_geobucks": 50,
    },
    {
        "id": "finish_10_quests",
        "name": "Quest Veteran",
        "description": "Complete 10 quests.",
        "reward_geobucks": 100,
    }
]

def apply_reward_multiplier(reward_str: str, multiplier: float) -> dict:
    """Apply multiplier to reward like '40 XP', and calculate GeoBucks reward."""
    try:
        base_xp = int(reward_str.split()[0])
    except Exception:
        base_xp = 20

    final_xp = int(base_xp * multiplier)
    geobucks = max(1, int(final_xp / 10))  # 💸 1 GeoBuck per 10 XP, always min 1


    return {
        "base_reward": f"{base_xp} XP",
        "multiplier": round(multiplier, 2),
        "final_reward": f"{final_xp} XP",
        "geobucks_reward": geobucks
    }


def calculate_geobucks(weather):
    """Determine GeoBucks reward based on air quality and weather difficulty."""
    air = weather.get("air_quality", {})
    status = air.get("status", "unknown")

    base_reward = 1  # baseline GeoBuck for any completed quest

    if status == "good":
        # Clean air — small eco bonus 🌿
        return base_reward + 1
    elif status == "moderate":
        # Normal — steady reward
        return base_reward
    elif status in ["bad", "very bad"]:
        # Pollution challenge bonus 🌫️
        return int(base_reward * 2)
    else:
        return base_reward



# === GAME STATE ===
current_public_quests = []

player = {
    "id": 1,
    "name": "Traveler",
    "level": 7,            # ⚡ Looks experienced for demo
    "xp": 220,
    "geobucks": 135,       # 💰 Some currency to show off purchases
    "active_quest": None,
    "progress": {
        "quests_completed": 14,     # 🏆 Achievements in progress
        "distance_walked": 12.7
    },
    "achievements": ["walk_10km", "finish_10_quests"]  # already unlocked a few
}



def xp_for_next_level(level: int) -> int:
    """XP needed to reach the next level."""
    return 100 + (level - 1) * 50


def add_xp(player, xp_gained: int):
    """Add XP, handle level-up logic."""
    player["xp"] += xp_gained
    leveled_up = False
    while player["xp"] >= xp_for_next_level(player["level"]):
        player["xp"] -= xp_for_next_level(player["level"])
        player["level"] += 1
        leveled_up = True
    return leveled_up


# === PUBLIC QUESTS ===
@app.get("/generate_quest")
def generate(lat: float = Query(...), lon: float = Query(...)):
    """
    Generate public AI quests (not automatically assigned).
    Stores them in memory for player selection.
    """
    global current_public_quests

    places = get_nearby_places(lat, lon)
    if not places:
        return {"error": "No places found nearby"}

    # --- Filter out private/duplicate places ---
    private_zones = load_zones()
    private_names = {zone["name"].lower() for zone in private_zones}
    private_quest_places = {
        quest["place"].lower()
        for zone in private_zones
        for quest in zone["quests"]
    }
    excluded_places = private_names | private_quest_places

    public_places = [p for p in places if p["name"].lower() not in excluded_places]
    if not public_places:
        return {"error": "No public places available (too close to private zones)"}

    # --- Generate and enrich quests ---
    quests = []
    for p in public_places[:3]:
        q = generate_quest(p)
        q["id"] = str(uuid4())  # ✅ unique quest ID
        weather = get_weather(q["lat"], q["lon"])
        multiplier = get_weather_multiplier(weather["weathercode"])
        reward_info = apply_reward_multiplier(q["reward"], multiplier)
        q["weather"] = weather
        q.update(reward_info)
        quests.append(q)

    current_public_quests = quests  # ✅ store globally

    return {
        "message": "New quests generated successfully.",
        "available_quests": quests
    }


@app.get("/get_available_quests")
def get_available_quests():
    """Return the last generated public quests."""
    if not current_public_quests:
        return {"error": "No quests generated yet."}
    return {"available_quests": current_public_quests}


@app.post("/ai_guide")
def guide_message(quest: dict):
    return {"message": ai_recommendation(quest)}


# === PRIVATE QUESTS (QR ZONES) ===
@app.get("/scan_qr")
def scan_qr(code: str):
    """
    Scan a zone QR code → returns all quests with weather & multiplier.
    """
    zone = find_zone_by_code(code)
    if not zone:
        return {"error": "Invalid QR code"}

    quests_with_weather = []
    for quest in zone["quests"]:
        weather = get_weather(quest["lat"], quest["lon"])
        multiplier = get_weather_multiplier(weather["weathercode"])
        reward_info = apply_reward_multiplier(quest["reward"], multiplier)
        quest_with_weather = {**quest, "weather": weather, **reward_info}
        quests_with_weather.append(quest_with_weather)

    return {
        "zone": {
            "name": zone["name"],
            "description": zone["description"],
            "type": zone["type"]
        },
        "quests": quests_with_weather
    }


@app.get("/complete_quest_by_qr")
def complete_quest_by_qr(
    qr_key: str = Query(...),
    user_lat: float = Query(...),
    user_lon: float = Query(...)
):
    """
    Complete a specific quest by scanning its QR code.
    Verifies both the secret qr_key and the player's proximity (within 25 m).
    Adds XP to the player when successful.
    """
    zones = load_zones()
    for zone in zones:
        for quest in zone["quests"]:
            if quest.get("qr_key") == qr_key:
                q_lat = quest["lat"]
                q_lon = quest["lon"]
                distance = haversine(user_lat, user_lon, q_lat, q_lon)
                weather = get_weather(q_lat, q_lon)
                multiplier = get_weather_multiplier(weather["weathercode"])
                reward_info = apply_reward_multiplier(quest["reward"], multiplier)

                # Extract XP
                try:
                    xp_gained = int(reward_info["final_reward"].split()[0])
                except Exception:
                    xp_gained = 20

                if distance < 25:
                    leveled_up = add_xp(player, xp_gained)
                    geobucks_gained = reward_info.get("geobucks_reward", 0)
                    player["geobucks"] += geobucks_gained

                    return {
                        "status": "completed",
                        "message": (
                            f"You completed '{quest['goal']}' at {quest['place']} "
                            f"and earned {reward_info['final_reward']}!"
                        ),
                        "quest": quest,
                        "weather": weather,
                        **reward_info,
                        "xp_gained": xp_gained,
                        "new_level": player["level"],
                        "current_xp": player["xp"],
                        "leveled_up": leveled_up,
                        "distance_m": round(distance, 1),
                        "geobucks_gained": geobucks_gained,
                        "total_geobucks": player["geobucks"],
                    }
                else:
                    return {
                        "status": "too_far",
                        "message": f"You are {int(distance)} m away — move closer to complete it!",
                        "quest": quest,
                        "weather": weather,
                        **reward_info,
                        "distance_m": round(distance, 1)
                    }

    return {"status": "error", "message": "Invalid or expired QR code."}


# === QR GENERATION ===
@app.get("/get_qr_code")
def get_qr_code(code: str):
    """Generate a QR image for a zone."""
    zone = find_zone_by_code(code)
    if not zone:
        return {"error": "Invalid code"}

    os.makedirs(QR_DIR, exist_ok=True)
    file_path = os.path.join(QR_DIR, f"{code}.png")

    if not os.path.exists(file_path):
        img = qrcode.make(code)
        img.save(file_path)

    return FileResponse(file_path, media_type="image/png")


@app.get("/get_quest_qr")
def get_quest_qr(qr_key: str):
    """Generate a QR image for a specific quest."""
    zones = load_zones()
    for zone in zones:
        for quest in zone["quests"]:
            if quest.get("qr_key") == qr_key:
                img = qrcode.make(qr_key)
                buf = BytesIO()
                img.save(buf, format="PNG")
                buf.seek(0)
                return StreamingResponse(buf, media_type="image/png")
    return {"error": "Invalid qr_key"}


# === PLAYER SYSTEM ===
@app.get("/player")
def get_player():
    """Get current dummy player status."""
    return player


@app.get("/get_active_quest")
def get_active_quest():
    """Return player's active quest, if any."""
    if not player["active_quest"]:
        return {"active_quest": None, "message": "No active quest selected."}
    return {"active_quest": player["active_quest"]}


@app.post("/set_active_quest")
def set_active_quest(quest_id: str = Query(...)):
    """Player chooses an active quest by ID."""
    global current_public_quests

    if not current_public_quests:
        return {"error": "No available quests. Generate some first."}

    quest = next((q for q in current_public_quests if q["id"] == quest_id), None)
    if not quest:
        return {"error": "Invalid quest ID."}

    player["active_quest"] = quest
    return {"message": f"Quest '{quest['place']}' set as active.", "active_quest": quest}


@app.post("/complete_active_quest")
def complete_active_quest(
    current_lat: float = Query(...),
    current_lon: float = Query(...)
):
    """Mark player's active quest as completed and add XP + GeoBucks if close enough."""
    if not player["active_quest"]:
        return {"error": "No active quest assigned."}

    quest = player["active_quest"]
    q_lat = quest["lat"]
    q_lon = quest["lon"]

    distance = haversine(current_lat, current_lon, q_lat, q_lon)

    # Require proximity (like public quest distance check)
    if distance > 100:
        return {
            "status": "too_far",
            "message": f"You are {int(distance)} m away — move closer to complete it!",
            "distance_m": round(distance, 1)
        }

    # Fetch live weather (with air quality)
    weather = get_weather(q_lat, q_lon)
    quest["weather"] = weather

    # Reward logic (XP)
    try:
        xp = int(quest["reward"].split()[0])
    except Exception:
        xp = 20

    leveled_up = add_xp(player, xp)

    # 💰 Calculate GeoBucks based on environment
    geobucks_gained = calculate_geobucks(weather)
    player["geobucks"] += geobucks_gained

    # Reset quest
    player["active_quest"] = None

    return {
        "status": "completed",
        "xp_gained": xp,
        "geobucks_gained": geobucks_gained,
        "new_level": player["level"],
        "current_xp": player["xp"],
        "total_geobucks": player["geobucks"],
        "leveled_up": leveled_up,
        "weather": weather,
        "message": (
            f"You completed '{quest['place']}' and earned {xp} XP "
            f"+ {geobucks_gained} GeoBucks!"
        ),
        "distance_m": round(distance, 1)
    }



@app.get("/check_weather_for_quest")
def check_weather_for_quest(quest_id: str):
    global current_public_quests

    quest = next((q for q in current_public_quests if q["id"] == quest_id), None)
    if not quest:
        return {"error": "Quest not found."}

    result = check_quest_weather_and_recommend(quest)

    # 🧩 If an alternative quest is suggested, assign ID & add it to available quests
    if not result.get("is_okay") and "suggested_quest" in result and result["suggested_quest"]:
        suggested = result["suggested_quest"]
        suggested["id"] = str(uuid4())  # assign new ID
        current_public_quests.append(suggested)
        result["suggested_quest"]["id"] = suggested["id"]
        result["added_to_available_quests"] = True

    return result


@app.get("/shop")
def get_shop():
    """Simple GeoBucks shop."""
    return {
        "items": [
            {"name": "AI Travel Hint", "cost": 10},
            {"name": "Weather Immunity (1 quest)", "cost": 25},
            {"name": "Unlock Hidden Quest", "cost": 50},
            {"name": "Exclusive Explorer Badge", "cost": 100}
        ]
    }

@app.post("/buy_item")
def buy_item(item_name: str = Query(...)):
    """Buy virtual items using GeoBucks."""
    shop = {
        "AI Travel Hint": 10,
        "Weather Immunity (1 quest)": 25,
        "Unlock Hidden Quest": 50,
        "Exclusive Explorer Badge": 100
    }
    cost = shop.get(item_name)
    if not cost:
        return {"error": "Item not found"}
    if player["geobucks"] < cost:
        return {"error": "Not enough GeoBucks"}

    player["geobucks"] -= cost
    return {
        "message": f"You purchased {item_name}!",
        "remaining_geobucks": player["geobucks"]
    }


@app.post("/buy_geobucks")
def buy_geobucks(amount: int = Query(...)):
    """
    💰 Dummy endpoint to simulate buying GeoBucks with real money.
    In production, this would connect to Stripe, PayPal, or in-app purchases.
    For now, it just adds the requested amount to player's balance.
    """
    if amount <= 0:
        return {"error": "Amount must be positive."}

    # Simulate purchase confirmation
    player["geobucks"] += amount

    return {
        "message": f"Successfully purchased {amount} GeoBucks!",
        "total_geobucks": player["geobucks"],
        "note": "This is a simulated purchase. No real money involved."
    }


@app.get("/achievements")
def get_achievements():
    """Return all achievements with player unlock status."""
    unlocked = set(player["achievements"])
    data = [
        {**a, "unlocked": a["id"] in unlocked}
        for a in achievements
    ]
    return {"achievements": data, "total_geobucks": player["geobucks"]}


@app.post("/achievements/unlock")
def unlock_achievement(achievement_id: str = Query(...)):
    """Manually unlock an achievement and reward GeoBucks."""
    ach = next((a for a in achievements if a["id"] == achievement_id), None)
    if not ach:
        return {"error": "Achievement not found."}

    if achievement_id in player["achievements"]:
        return {"message": f"Achievement '{ach['name']}' already unlocked."}

    # Mark unlocked and reward player
    player["achievements"].append(achievement_id)
    player["geobucks"] += ach["reward_geobucks"]

    return {
        "message": f"Achievement unlocked: {ach['name']}! You earned {ach['reward_geobucks']} GeoBucks.",
        "total_geobucks": player["geobucks"],
        "achievement": ach
    }


# === LEADERBOARD ===
@app.get("/leaderboard")
def get_leaderboard():
    """Returns a dummy leaderboard including the current player."""
    global player

    dummy_leaderboard = [
        {"name": "ExplorerA", "level": 12, "xp": 480, "geobucks": 620},
        {"name": "RangerB", "level": 9, "xp": 310, "geobucks": 280},
        {"name": "Traveler", "level": player["level"], "xp": player["xp"], "geobucks": player["geobucks"]},  # 👈 You
        {"name": "WandererC", "level": 5, "xp": 140, "geobucks": 95},
        {"name": "NomadD", "level": 3, "xp": 80, "geobucks": 45},
    ]

    # Sort by level and xp for realism
    sorted_board = sorted(dummy_leaderboard, key=lambda x: (x["level"], x["xp"]), reverse=True)

    # Find player rank
    player_rank = next((i + 1 for i, p in enumerate(sorted_board) if p["name"] == "Traveler"), None)

    return {
        "leaderboard": sorted_board,
        "player_rank": player_rank,
        "player_summary": {
            "name": player["name"],
            "level": player["level"],
            "xp": player["xp"],
            "geobucks": player["geobucks"],
            "rank": player_rank
        }
    }