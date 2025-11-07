from fastapi import FastAPI, Query
from services.places import get_nearby_places
from services.weather import get_weather
from services.quest_gen import generate_quest, ai_recommendation
from services.logic import choose_best_quest

app = FastAPI()

@app.get("/generate_quest")
def generate(lat: float = Query(...), lon: float = Query(...)):
    places = get_nearby_places(lat, lon)
    if not places:
        return {"error": "No places found nearby"}

    quests = [generate_quest(p) for p in places[:3]]
    print(quests)

    for q in quests:
        q["weather"] = get_weather(q["lat"], q["lon"])

    active_quest = choose_best_quest(quests)
    message = ai_recommendation(active_quest)

    return {"active_quest": active_quest, "ai_message": message, "all_quests": quests}

@app.post("/ai_guide")
def guide_message(quest: dict):
    from services.quest_gen import ai_recommendation
    return {"message": ai_recommendation(quest)}
