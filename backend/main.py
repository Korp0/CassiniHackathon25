from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.places import get_nearby_places
from services.weather import get_weather
from services.quest_gen import generate_quest, ai_recommendation
from services.logic import choose_best_quest
from utils.calc import haversine

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Quest(BaseModel):
    lat: float
    lon: float
    place: str
    reward: str

class CompleteQuestRequest(BaseModel):
    quest: Quest
    current_lat: float
    current_lon: float


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
            "message": f"You completed {quest.place} and earned {quest.reward}!"
        }
    else:
        return {
            "status": "too_far",
            "message": f"You are {int(distance)}m away — get closer!"
        }


@app.post("/ai_guide")
def guide_message(quest: dict):
    from services.quest_gen import ai_recommendation
    return {"message": ai_recommendation(quest)}
