from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse, StreamingResponse
from io import BytesIO
import qrcode
import os

# === Services ===
from services.places import get_nearby_places
from services.weather import get_weather
from services.quest_gen import generate_quest, ai_recommendation
from services.logic import choose_best_quest
from services.zones import find_zone_by_code, load_zones
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


# === PUBLIC (AI-GENERATED) QUESTS ===
@app.get("/generate_quest")
def generate(lat: float = Query(...), lon: float = Query(...)):
    places = get_nearby_places(lat, lon)
    if not places:
        return {"error": "No places found nearby"}

    quests = [generate_quest(p) for p in places[:3]]
    for q in quests:
        q["weather"] = get_weather(q["lat"], q["lon"])

    active_quest = choose_best_quest(quests)
    message = ai_recommendation(active_quest)
    return {"active_quest": active_quest, "ai_message": message, "all_quests": quests}


@app.post("/complete_quest")
def complete_quest(data: CompleteQuestRequest):
    quest = data.quest
    user_lat = data.current_lat
    user_lon = data.current_lon
    q_lat = quest.lat
    q_lon = quest.lon

    distance = haversine(user_lat, user_lon, q_lat, q_lon)

    if distance < 100:
        return {
            "status": "completed",
            "message": f"You completed {quest.place} and earned {quest.reward}!",
            "distance_m": round(distance, 1)
        }
    else:
        return {
            "status": "too_far",
            "message": f"You are {int(distance)}m away — get closer!",
            "distance_m": round(distance, 1)
        }


@app.post("/ai_guide")
def guide_message(quest: dict):
    return {"message": ai_recommendation(quest)}


# === PRIVATE (ZONE-BASED) QUESTS ===
@app.get("/scan_qr")
def scan_qr(code: str):
    """Scan a zone QR code → returns all quests for that zone."""
    zone = find_zone_by_code(code)
    if not zone:
        return {"error": "Invalid QR code"}

    return {
        "zone": {
            "name": zone["name"],
            "description": zone["description"],
            "type": zone["type"]
        },
        "quests": zone["quests"]
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
    """
    zones = load_zones()
    for zone in zones:
        for quest in zone["quests"]:
            if quest.get("qr_key") == qr_key:
                q_lat = quest["lat"]
                q_lon = quest["lon"]
                distance = haversine(user_lat, user_lon, q_lat, q_lon)

                if distance < 25:  # stricter distance check
                    return {
                        "status": "completed",
                        "message": f"You completed '{quest['goal']}' at {quest['place']} and earned {quest['reward']}!",
                        "quest": quest,
                        "distance_m": round(distance, 1)
                    }
                else:
                    return {
                        "status": "too_far",
                        "message": f"You are {int(distance)}m away from the target — move closer to complete it!",
                        "quest": quest,
                        "distance_m": round(distance, 1)
                    }

    return {"status": "error", "message": "Invalid or expired QR code."}


# === QR GENERATION ===
@app.get("/get_qr_code")
def get_qr_code(code: str):
    """Generate a QR image for a zone (encodes only the zone code)."""
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
    """Generate a QR image for a specific quest (encodes its secret qr_key)."""
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
