# 🎨 Frontend - Tailwind CSS Migrácia DOKONČENÁ

## ✅ Dokončené úpravy

### 1. **Tailwind konfigurácia**
- ✅ Vytvorené `tailwind.config.js` s custom animáciami
- ✅ Vytvorené `postcss.config.js`
- ✅ Upravené `package.json` s Tailwind dependencies
- ✅ Pridané `@tailwind` direktívy do `src/index.css`

### 2. **Konvertované komponenty**

#### WeatherDisplay.jsx
- ✅ Odstránený `import './WeatherDisplay.css'`
- ✅ Použité Tailwind: `fixed`, `top-5`, `right-5`, `bg-white/95`, `backdrop-blur-md`, `rounded-2xl`, `shadow-lg`
- ✅ Hover efekt: `hover:scale-105`

#### QuestModal.jsx
- ✅ Odstránený `import './QuestModal.css'`
- ✅ Použité Tailwind: modal overlay s `fixed inset-0 bg-black/70`
- ✅ Animácie: `animate-fadeIn`, `animate-slideUp`
- ✅ Gradient button: `bg-gradient-to-r from-blue-600 to-blue-500`
- ✅ Hover efekty: `hover:-translate-y-0.5`, `hover:rotate-90`

#### Map.jsx
- ✅ Odstránený `import './Map.css'`
- ✅ Player marker s inline CSS + pulse animácia
- ✅ Popup s Tailwind triedami
- ✅ Zoom controls: `absolute bottom-36 right-5`, `w-11 h-11`, `rounded-xl`
- ✅ Hover efekty: `hover:scale-105`, `active:scale-95`

#### LoadingScreen.jsx
- ✅ Odstránený `import './LoadingScreen.css'`
- ✅ Gradient background: `bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500`
- ✅ Spinner: `animate-spin` (built-in Tailwind)

#### App.jsx
- ✅ Odstránený `import './App.css'`
- ✅ Error screen s gradientom
- ✅ AI message banner: `animate-slideDown`, gradient background
- ✅ Refresh button: zarovnaný s zoom controls (`bottom-[156px]`)
- ✅ Quest counter: `backdrop-blur-sm`, `shadow-lg`
- ✅ Error banner: `fixed`, `bg-red-500`
- ✅ Bottom bar: `bg-white/98`, `backdrop-blur-sm`, gradient aktívny quest

### 3. **Custom Tailwind animácie**
Pridané do `tailwind.config.js`:
- `fadeIn` - pre modal overlay
- `slideUp` - pre modal content
- `slideDown` - pre AI banner

## 🚀 Ako spustiť

```powershell
# 1. Prejsť do frontend adresára
cd "D:\Cassini hackathon\CassiniHackathon25\frontend"

# 2. Nainštalovať závislosti
npm install

# 3. Spustiť dev server
npm run dev
```

## 📋 Použité Tailwind utility

### Layout & Positioning
- `fixed`, `absolute`, `relative`
- `inset-0`, `top-5`, `right-5`, `bottom-36`, `left-1/2`
- `w-full`, `h-screen`, `max-w-md`, `min-w-[200px]`
- `z-50`, `z-[9999]`, `z-40`

### Flexbox
- `flex`, `flex-col`, `items-center`, `justify-center`
- `gap-2`, `gap-3`, `gap-4`
- `flex-1`, `flex-shrink-0`

### Colors & Backgrounds
- `bg-white`, `bg-white/95`, `bg-black/70`
- `bg-gradient-to-r from-blue-600 to-blue-500`
- `bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500`
- `text-gray-900`, `text-white`, `text-blue-600`

### Spacing
- `p-3`, `px-4`, `py-3`, `px-5`
- `m-2`, `mt-2`, `mb-3`
- `space-y-5`

### Typography
- `text-sm`, `text-base`, `text-lg`, `text-2xl`, `text-3xl`
- `font-bold`, `font-semibold`, `font-medium`
- `leading-none`, `leading-tight`, `leading-relaxed`
- `tracking-wide`, `uppercase`, `capitalize`

### Borders & Shadows
- `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`
- `shadow-lg`, `shadow-xl`, `shadow-2xl`
- `border`, `border-2`, `border-gray-200`

### Effects
- `backdrop-blur-sm`, `backdrop-blur-md`
- `opacity-60`, `bg-white/95`
- `transition-all`, `transition-colors`

### Hover & Active States
- `hover:scale-105`, `hover:rotate-90`, `hover:bg-gray-50`
- `hover:-translate-y-0.5`, `hover:from-blue-700`
- `active:scale-95`, `active:translate-y-0`

### Animations
- `animate-spin` (built-in)
- `animate-ping` (built-in)
- `animate-fadeIn` (custom)
- `animate-slideUp` (custom)
- `animate-slideDown` (custom)

### Responsive (Mobile-first)
- Všetky komponenty sú mobile-first
- Použité `max-w-[90%]` pre mobile
- `truncate` pre dlhé texty

## 🎯 Tailwind Features využité

1. **Utility-first approach** - žiadne custom CSS triedy
2. **JIT mode** - dynamické generovanie tried
3. **Arbitrary values** - `bottom-[156px]`, `z-[9999]`, `max-w-[90%]`
4. **Opacity modifiers** - `bg-white/95`, `bg-black/70`
5. **Custom animations** - fadeIn, slideUp, slideDown
6. **Gradient backgrounds** - multi-stop gradienty
7. **Backdrop filters** - blur efekty
8. **Transform utilities** - translate, scale, rotate
9. **Transition utilities** - smooth animations

## 📁 Štruktúra projektu

```
frontend/
├── src/
│   ├── components/
│   │   ├── Map.jsx ✅ Tailwind
│   │   ├── QuestModal.jsx ✅ Tailwind
│   │   ├── WeatherDisplay.jsx ✅ Tailwind
│   │   ├── LoadingScreen.jsx ✅ Tailwind
│   │   ├── Map.css (prázdny)
│   │   ├── QuestModal.css (prázdny)
│   │   ├── WeatherDisplay.css (prázdny)
│   │   └── LoadingScreen.css (prázdny)
│   ├── hooks/
│   │   └── useGeolocation.js
│   ├── utils/
│   │   └── api.js
│   ├── App.jsx ✅ Tailwind
│   ├── App.css (prázdny)
│   ├── index.css (@tailwind directives)
│   └── main.jsx
├── tailwind.config.js ✅
├── postcss.config.js ✅
└── package.json ✅

```

## ⚡ Optimalizácie

- **Purge unused CSS** - Tailwind automaticky odstráni nepoužité triedy v produkcii
- **JIT compiler** - rýchlejší build
- **No CSS conflicts** - utility triedy eliminujú konflikty
- **Better performance** - menší CSS bundle v produkcii

## 🐛 Troubleshooting

Ak vidíš chyby pri `npm install`:
```powershell
npm install --legacy-peer-deps
```

Ak CSS nefunguje po inštalácii:
```powershell
# Vyčisti cache a reštartuj
npm run dev
```

## 🎉 Hotovo!

Frontend teraz **plne používa Tailwind CSS** namiesto statických CSS súborov. Všetky komponenty sú upravené a pripravené na použitie!
