import { useState, useEffect } from 'react';
import Map from './components/Map';
import QuestModal from './components/QuestModal';
import WeatherDisplay from './components/WeatherDisplay';
import LoadingScreen from './components/LoadingScreen';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchQuests, fetchZoneByCode } from './utils/api';
import StartupModal from './components/StartupModal';

function App() {
  const { position, error: geoError, loading: geoLoading } = useGeolocation();
  const [quests, setQuests] = useState([]);
  const [activeQuest, setActiveQuest] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  // Mode: 'default' | 'public' | 'private'
  const [mode, setMode] = useState('default');

  // Načítanie questov z backendu - iba v public mode
  useEffect(() => {
    const loadQuests = async () => {
      if (!position) return;
      if (mode !== 'public') return;

      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchQuests(position.lat, position.lng);
        
        if (data.error) {
          setError(data.error);
        } else {
          setQuests(data.all_quests || []);
          setActiveQuest(data.active_quest);
          setAiMessage(data.ai_message);
          
          // Nastavenie počasia z aktívneho questu
          if (data.active_quest?.weather) {
            setWeather(data.active_quest.weather);
          }
        }
      } catch (err) {
        console.error('Error loading quests:', err);
        setError('Nepodarilo sa načítať questy. Skontroluj či beží backend.');
      } finally {
        setLoading(false);
      }
    };

    if (position && !geoLoading && mode === 'public') {
      loadQuests();
    }
  }, [position, geoLoading, mode]);

  // Handler pre výber módu
  const handleModeSelect = async (selectedMode, code = null) => {
    if (selectedMode === 'public') {
      setMode('public');
      setQuests([]);
      setMapCenter(null);
      setAiMessage('');
      setShowModeSelector(false);
    } else if (selectedMode === 'private' && code) {
      setLoading(true);
      try {
        const data = await fetchZoneByCode(code);
        if (data.error) {
          setError(data.error || 'Neplatné ID');
        } else {
          const zoneQuests = data.quests || [];
          setQuests(zoneQuests);
          setActiveQuest(zoneQuests[0] || null);
          setAiMessage(`Zobrazené miesto: ${data.zone?.name || ''}`);
          if (zoneQuests[0]) {
            const lat = parseFloat(zoneQuests[0].lat);
            const lon = parseFloat(zoneQuests[0].lon);
            setMapCenter([lat, lon]);
          }
          setMode('private');
          setShowModeSelector(false);
        }
      } catch (err) {
        console.error('Error fetching zone:', err);
        setError('Nepodarilo sa načítať miesto z backendu.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handler pre exit z módu
  const handleExitMode = () => {
    setMode('default');
    setQuests([]);
    setActiveQuest(null);
    setWeather(null);
    setAiMessage('');
    setMapCenter(null);
    setError(null);
  };

  // Loading screen
  if (geoLoading) {
    return <LoadingScreen message="Získavam tvoju polohu..." />;
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Mode Selector Modal */}
      {showModeSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100000] p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full animate-slideUp">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Vyber mód</h2>
            <div className="space-y-4">
              <button
                onClick={() => handleModeSelect('public')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
              >
                <div className="text-4xl mb-2">🗺️</div>
                <div className="text-lg">Verejný mód</div>
                <div className="text-sm opacity-90">Body v blízkosti</div>
              </button>
              <div>
                <button
                  onClick={() => {
                    const code = document.getElementById('zone-code-input').value.trim();
                    if (code) {
                      handleModeSelect('private', code);
                    } else {
                      setError('Zadaj ID zóny');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95"
                >
                  <div className="text-4xl mb-2">📷</div>
                  <div className="text-lg">Súkromný mód</div>
                  <div className="text-sm opacity-90">Scan QR kód</div>
                </button>
                <input
                  id="zone-code-input"
                  type="text"
                  placeholder="Zadaj ID zóny"
                  className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={() => setShowModeSelector(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition"
              >
                Zrušiť
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mapa */}
      <Map
        position={position}
        quests={quests}
        onQuestClick={setSelectedQuest}
        centerOnPlayer={false}
        mapCenter={mapCenter}
      />

  {/* Weather Display */}
  {weather && <WeatherDisplay weather={weather} position={position} />}

      {/* AI Message Banner */}
      {aiMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 top-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-3 rounded-full shadow-xl z-[99999] flex items-center gap-3 max-w-[90%] animate-slideDown">
          <div className="text-2xl">🤖</div>
          <p className="text-sm font-medium leading-snug">{aiMessage}</p>
        </div>
      )}

      {/* Mode Control Buttons */}
      {mode === 'default' && (
        <button
          onClick={() => setShowModeSelector(true)}
          className="fixed right-4 bottom-60 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-full shadow-xl z-[99999] transform transition hover:scale-110 active:scale-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span>Explore</span>
          </div>
        </button>
      )}
      
      {(mode === 'public' || mode === 'private') && (
        <>
          {/* Exit Mode Button */}
          <button
            onClick={handleExitMode}
            className="fixed right-4 bottom-60 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-full shadow-xl z-[99999] transform transition hover:scale-110 active:scale-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🚪</span>
              <span>Exit</span>
            </div>
          </button>
          
          {/* Refresh Button (only in public mode) */}
          {mode === 'public' && (
            <button
              className="fixed right-4 bottom-80 w-14 h-14 bg-white border-2 border-gray-200 rounded-full shadow-xl flex items-center justify-center text-2xl z-[99999] hover:scale-110 hover:rotate-90 active:scale-100 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => {
                if (position) {
                  setLoading(true);
                  fetchQuests(position.lat, position.lng)
                    .then(data => {
                      setQuests(data.all_quests || []);
                      setActiveQuest(data.active_quest);
                      setAiMessage(data.ai_message);
                      if (data.active_quest?.weather) {
                        setWeather(data.active_quest.weather);
                      }
                    })
                    .catch(err => {
                      console.error('Error refreshing quests:', err);
                      setError('Nepodarilo sa obnoviť questy.');
                    })
                    .finally(() => setLoading(false));
                }
              }}
              disabled={loading}
            >
              {loading ? '⏳' : '🔄'}
            </button>
          )}
        </>
      )}

      {/* Mode Indicator & Quest Count */}
      <div className="fixed top-5 left-5 flex flex-col gap-2 z-[99999]">
        {/* Mode Badge */}
        <div className={`bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg ${
          mode === 'default' ? 'border-2 border-gray-300' : 
          mode === 'public' ? 'border-2 border-blue-400' : 
          'border-2 border-purple-400'
        }`}>
          <span className="text-xl">
            {mode === 'default' ? '🧭' : mode === 'public' ? '🗺️' : '📷'}
          </span>
          <span className="font-bold text-sm text-gray-900">
            {mode === 'default' ? 'Browse' : mode === 'public' ? 'Public' : 'Private'}
          </span>
        </div>
        
        {/* Quest Count (only if quests exist) */}
        {quests.length > 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-sm text-gray-900">{quests.length} questov</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="fixed left-1/2 -translate-x-1/2 top-5 bg-red-500 text-white px-5 py-3 rounded-xl flex items-center gap-4 shadow-xl z-[100000] max-w-[90%]">
          <span className="text-sm font-medium">⚠️ {error}</span>
          <button 
            className="text-white hover:bg-white/20 rounded-full w-6 h-6 flex items-center justify-center transition-colors" 
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Quest Modal */}
      {selectedQuest && (
        <QuestModal
          quest={selectedQuest}
          onClose={() => setSelectedQuest(null)}
        />
      )}

      {/* Bottom Info Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/98 backdrop-blur-sm border-t border-gray-200 py-3 px-5 flex flex-col gap-2 z-[99999] shadow-2xl">
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
          <span className="text-lg">📍</span>
          <span className="text-sm text-gray-800 font-medium flex-1 truncate">
            {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Získavam polohu...'}
          </span>
        </div>
        {activeQuest && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg px-3 py-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-bold flex-1 truncate">
              Aktívny: {activeQuest.place}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
