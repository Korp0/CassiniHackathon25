# 🚀 Quick Start Guide

## Inštalácia a spustenie

```bash
cd "d:\Cassini hackathon\CassiniHackathon25\frontend"

# 1. Nainštaluj závislosti
npm install

# 2. Spusti backend (v inom termináli)
cd ../backend/AdaptiveTourism
pip install -r requirements.txt
uvicorn main:app --reload

# 3. Spusti frontend
npm run dev
```

## Otvorenie v prehliadači

Frontend: http://localhost:5173
Backend: http://localhost:8000

## Prvé kroky

1. **Povol geolokáciu** v prehliadači
2. **Počkaj** na načítanie questov z backendu
3. **Klikni** na quest pin na mape pre detail
4. **Refresh** tlačidlo obnoví questy

## Hlavné komponenty

```
src/
├── App.jsx                 # Hlavná aplikácia
├── components/
│   ├── Map.jsx            # Leaflet mapa
│   ├── QuestModal.jsx     # Quest detail
│   ├── WeatherDisplay.jsx # Počasie
│   └── LoadingScreen.jsx  # Loading
├── hooks/
│   └── useGeolocation.js  # Geolokácia hook
└── utils/
    └── api.js             # API calls
```

## Prispôsobenie

### Backend URL
Zmeň v `.env`:
```
VITE_API_URL=http://localhost:8000
```

### Štýly
- `App.css` - Hlavné štýly
- `components/*.css` - Komponentové štýly

### Default pozícia (ak geolokácia zlyhá)
V `Map.jsx`, riadok 48:
```javascript
const defaultCenter = [48.7164, 21.2611]; // Košice
```

## Testovanie bez backendu

Ak backend nefunguje, môžeš použiť mock data v `App.jsx`:

```javascript
// Pridaj do useEffect pred fetchQuests
const mockData = {
  active_quest: {
    place: "Test Location",
    goal: "Test goal",
    reward: "20 XP",
    educational_info: "Test info",
    lat: position.lat + 0.001,
    lon: position.lng + 0.001,
    weather: {
      temperature: 15,
      condition_text: "clear sky"
    }
  },
  all_quests: [/* ... */],
  ai_message: "Test message"
};
setQuests([mockData.active_quest]);
```

## 📱 Mobile Testing

### Chrome DevTools
1. F12 → Toggle device toolbar
2. Vyber mobile zariadenie
3. Otestuj touch interakcie

### Real device
1. Spusti na tej istej WiFi sieti
2. Zisti IP adresu počítača: `ipconfig`
3. Otvor v mobile: `http://[IP]:5173`
4. Nezabudni nastaviť backend URL na IP

## Common Issues

❌ **CORS error** → Pridaj CORS do FastAPI backendu:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

❌ **Leaflet ikony sa nezobrazia** → Cache refresh (Ctrl+Shift+R)

❌ **Geolokácia nefunguje** → Použi HTTPS alebo localhost

## 🎯 Features Checklist

- [x] Geolokácia
- [x] Leaflet mapa
- [x] Quest markers
- [x] Quest modal
- [x] Weather display
- [x] API integrácia
- [x] Mobile-first dizajn
- [x] Loading states
- [x] Error handling
- [x] Refresh quests
- [ ] Quest completion (TODO)
- [ ] Progress tracking (TODO)

## Ďalšie kroky

1. Implementuj quest completion logic
2. Pridaj user authentication
3. Vytvor quest history
4. Pridaj achievement system
5. AR prvky pre mobilný zážitok
