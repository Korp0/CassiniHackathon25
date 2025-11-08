# 🗺️ Cassini Hackathon - Quest Explorer Frontend

Mobile-first frontend aplikácia pre turistické questy s integráciou AI a vesmírnych dát.

## 🚀 Technológie

- **React 19** - UI framework
- **Vite** - Build tool a dev server
- **Leaflet** - Mapová knižnica
- **React Leaflet** - React wrapper pre Leaflet
- **Axios** - HTTP klient pre API volania

## 📦 Inštalácia

```bash
# Inštalácia závislostí
npm install

# Nastavenie backend URL (voliteľné)
# Vytvor .env súbor a nastav:
VITE_API_URL=http://localhost:8000
```

## 🎮 Spustenie

```bash
# Development server
npm run dev

# Build pre produkciu
npm run build

# Preview production buildu
npm run preview
```

## 🏗️ Štruktúra projektu

```
src/
├── components/          # React komponenty
│   ├── Map.jsx         # Hlavná mapa s Leaflet
│   ├── QuestModal.jsx  # Detail quest okno
│   ├── WeatherDisplay.jsx  # Počasie widget
│   └── LoadingScreen.jsx   # Loading obrazovka
├── hooks/              # Custom React hooks
│   └── useGeolocation.js   # Hook pre geolokáciu
├── utils/              # Utility funkcie
│   └── api.js          # API wrapper pre backend
├── App.jsx             # Hlavná aplikácia
├── App.css             # Globálne štýly
└── main.jsx            # Entry point
```

## 🎯 Funkcie

### ✅ Implementované

- 📍 **Real-time geolokácia** - Sledovanie pozície používateľa
- 🗺️ **Interaktívna mapa** - Leaflet s OpenStreetMap
- 🎯 **Quest markers** - Vizualizácia questov na mape
- 🌤️ **Weather display** - Zobrazenie počasia z backendu
- 🤖 **AI odporúčania** - Správy od AI agenta
- 📱 **Mobile-first dizajn** - Optimalizované pre mobil
- 🔄 **Refresh funkcia** - Obnovenie questov

### 🎨 UI Komponenty

- **Mapa** - Centrálny prvok s pozíciou hráča a quest pinmi
- **Quest Modal** - Detail quest s úlohou, odmenou a info
- **Weather Widget** - Aktuálne počasie na pozícii hráča
- **Quest Counter** - Počet dostupných questov
- **Bottom Bar** - Info o pozícii a aktívnom queste
- **AI Banner** - Odporúčania od AI agenta

## 🔧 API Integrácia

Backend endpoint: `GET /generate_quest?lat={lat}&lon={lon}`

Očakávaná odpoveď:
```json
{
  "active_quest": {
    "place": "Názov miesta",
    "goal": "Popis úlohy",
    "reward": "20 XP",
    "educational_info": "Zaujímavosť",
    "lat": 48.7164,
    "lon": 21.2611,
    "weather": {
      "temperature": 15,
      "condition_text": "clear sky"
    }
  },
  "all_quests": [...],
  "ai_message": "Motivačná správa"
}
```

## 📱 Mobile-first Design

- Responzívne komponenty
- Touch-friendly UI
- Optimalizované pre portrait aj landscape
- Minimálne 320px šírka
- Plynulé animácie

## 🎨 Téma a Štýly

- **Farby**: Blue (#2563eb), Purple (#667eea), Amber (#fbbf24)
- **Písmo**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- **Borderové rádiusy**: 12-24px pre moderný vzhľad
- **Tiene**: Multi-layer shadows pre hĺbku
- **Animácie**: Smooth transitions a keyframe animácie

## 🐛 Troubleshooting

### Backend sa nepripája
- Skontroluj či beží FastAPI backend na porte 8000
- Over správne nastavenie `VITE_API_URL` v `.env`

### Geolokácia nefunguje
- Povol prístup k polohe v prehliadači
- HTTPS je potrebné pre production (HTTP OK pre localhost)

### Mapa sa nezobrazuje
- Skontroluj že sú nainštalované leaflet závislosti
- Over že je importované `leaflet/dist/leaflet.css`

## 📝 TODO (pre budúcnosť)

- [ ] Quest completion logic
- [ ] User progress tracking
- [ ] Augmented Reality prvky
- [ ] Offline mode
- [ ] Quest history
- [ ] Achievement system

## 👨‍💻 Development

Vytvorené na Cassini Hackathon 2025
