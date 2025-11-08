def choose_best_quest(quests):
    # weathercode < 50 means clear or cloudy, >=50 rain/snow
    for q in quests:
        code = q.get("weather", {}).get("weathercode", 0)
        if code < 50:
            return q
    return quests[0]
