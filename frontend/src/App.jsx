import { useState, useEffect } from 'react';
import Map from './components/Map';
import QuestModal from './components/QuestModal';
import WeatherDisplay from './components/WeatherDisplay';
import LoadingScreen from './components/LoadingScreen';
import { useGeolocation } from './hooks/useGeolocation';
import { fetchQuests, fetchZoneByCode, startQuest, setActiveQuest as apiSetActiveQuest, completeActiveQuest as apiCompleteActiveQuest, completeQuestByQr as apiCompleteQuestByQr } from './utils/api';
import ProfileModal from './components/ProfileModal';
import ShopModal from './components/ShopModal';
import StartupModal from './components/StartupModal';

function App() {
  const { position, error: geoError, loading: geoLoading } = useGeolocation();
  const [quests, setQuests] = useState([]);
  const [activeQuest, setActiveQuest] = useState(null);
  const [activationPending, setActivationPending] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [weather, setWeather] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiMessage, setAiMessage] = useState('');
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [notification, setNotification] = useState(null); // { text, type }
  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [profileKey, setProfileKey] = useState(0);
  
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
          const incoming = data.all_quests || [];

          // If we already have an activeQuest locally, preserve it and mark matching incoming quest
          if (activeQuest) {
            const merged = incoming.map(q => ({
              ...q,
              __active: (
                String(q.place) === String(activeQuest.place) &&
                Number(q.lat) === Number(activeQuest.lat) &&
                Number(q.lon) === Number(activeQuest.lon)
              )
            }));
            setQuests(merged);
          } else {
            // No local active quest: adopt backend active if provided
            if (data.active_quest) {
              setActiveQuest(data.active_quest);
            }
            const merged = incoming.map(q => ({
              ...q,
              __active: (data.active_quest && String(q.place) === String(data.active_quest.place) && Number(q.lat) === Number(data.active_quest.lat) && Number(q.lon) === Number(data.active_quest.lon))
            }));
            setQuests(merged);
          }

          setAiMessage(data.ai_message);

          // Nastavenie počasia z aktívneho questu (only if we don't have our own active)
          if (!activeQuest && data.active_quest?.weather) {
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
            // Try to inform backend about active quest if it has an id
            try {
              if (zoneQuests[0] && zoneQuests[0].id) {
                await apiSetActiveQuest(zoneQuests[0].id);
              }
            } catch (err) {
              console.warn('Could not set active quest for private zone on backend:', err);
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
    // Switch back to default mode and clear mode-specific state
    setMode('default');
    setQuests([]);
    setActiveQuest(null);
    setWeather(null);
    setAiMessage('');
    // Recenter map to player's current position if available so the user sees their location
    if (position && position.lat != null && position.lng != null) {
      setMapCenter([position.lat, position.lng]);
    } else {
      setMapCenter(null);
    }
    setError(null);
  };

  // Start (activate) a quest: call backend (mock) to check suitability (weather)
  const handleStartQuest = async (quest) => {
    // Prevent activating the same quest twice
    const isSameQuest = (a, b) => {
      if (!a || !b) return false;
      // Prefer comparing by id when available
      if (a.id && b.id) return String(a.id) === String(b.id);
      // Fallback: compare place + coordinates
      return (
        String(a.place) === String(b.place) &&
        Number(a.lat) === Number(b.lat) &&
        Number(a.lon) === Number(b.lon)
      );
    };

    if (isSameQuest(activeQuest, quest)) {
      // Already active — notify and do nothing
      setNotification({ text: `Quest ${quest.place} je už aktívny.`, type: 'info' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setActivationPending(true);
    setError(null);
    setAiMessage('Overujem vhodnosť miesta...');
    try {
      const res = await startQuest(quest);
      if (res && res.ok) {
        setActiveQuest(quest);
        setAiMessage(res.message || `Aktívny quest: ${quest.place}`);
        // notify user
        setNotification({ text: `Začal si quest: ${quest.place}`, type: 'success' });
        setTimeout(() => setNotification(null), 4500);
        // mark in list
        setQuests(prev => prev.map(q => ({ ...q, __active: (
          String(q.place) === String(quest.place) && Number(q.lat) === Number(quest.lat) && Number(q.lon) === Number(quest.lon)
        ) })));

        // also inform backend about chosen active quest (if it has an id)
        try {
          if (quest.id) {
            await apiSetActiveQuest(quest.id);
          }
        } catch (err) {
          console.error('Failed to set active quest on backend:', err);
          // non-fatal: show a warning but keep local state
          setError('Quest bol aktivovaný lokálne, ale nepodarilo sa ho nastaviť na serveri.');
        }
      } else {
        // Not OK: show message and offer to force-start
        const msg = (res && res.message) || 'Nepriaznivé podmienky.';
        setError(msg);
        // Offer user to continue anyway
        const force = window.confirm(msg + '\nChceš napriek tomu začať quest?');
        if (force) {
          setActiveQuest(quest);
          setAiMessage(`Aktívny quest (force): ${quest.place}`);
          setQuests(prev => prev.map(q => ({ ...q, __active: (
            String(q.place) === String(quest.place) && Number(q.lat) === Number(quest.lat) && Number(q.lon) === Number(quest.lon)
          ) })));
          setNotification({ text: `Začal si quest (force): ${quest.place}`, type: 'warning' });
          setTimeout(() => setNotification(null), 4500);
          try {
            if (quest.id) {
              await apiSetActiveQuest(quest.id);
            }
          } catch (err) {
            console.error('Failed to set active quest on backend (force):', err);
            setError('Quest bol aktivovaný lokálne, ale nepodarilo sa ho nastaviť na serveri.');
          }
        }
      }
    } catch (err) {
      console.error('Error starting quest:', err);
      setError('Chyba pri aktivácii questu. Skús znova.');
    } finally {
      setActivationPending(false);
    }
  };

  // Complete active quest
  const handleCompleteQuest = async () => {
    if (!activeQuest) return;
    if (!position) {
      setError('Nemám tvoju polohu, nemôžem dokončiť quest.');
      return;
    }

    setActivationPending(true);
    setError(null);
    try {
      // Private mode: try QR-based completion first
      if (mode === 'private' && activeQuest?.qr_key) {
        try {
          const resp = await apiCompleteQuestByQr(activeQuest.qr_key, position.lat, position.lng);
          if (resp && resp.status === 'completed') {
            const name = activeQuest.place;
            setActiveQuest(null);
            setQuests(prev => prev.map(q => ({ ...q, __active: false })));
            setNotification({ text: resp.message || `Dokončil si quest: ${name}`, type: 'success' });
            setTimeout(() => setNotification(null), 4500);
            return;
          } else if (resp && resp.status === 'too_far') {
            setError(resp.message || 'Príliš ďaleko na dokončenie questu.');
            return;
          } else {
            // resp.status === 'error' or unknown - fallthrough to fallback
            console.warn('QR completion returned non-complete status, falling back:', resp);
          }
        } catch (err) {
          console.warn('QR completion failed, will try fallback:', err);
        }

        // Fallback: if quest has an id, try to set it active on server and complete via active endpoint
        if (activeQuest.id) {
          try {
            await apiSetActiveQuest(activeQuest.id);
            const resp2 = await apiCompleteActiveQuest(position.lat, position.lng);
            if (resp2 && resp2.status === 'completed') {
              const name = activeQuest.place;
              setActiveQuest(null);
              setQuests(prev => prev.map(q => ({ ...q, __active: false })));
              setNotification({ text: resp2.message || `Dokončil si quest: ${name}`, type: 'success' });
              setTimeout(() => setNotification(null), 4500);
              return;
            }
            if (resp2 && resp2.status === 'too_far') {
              setError(resp2.message || 'Príliš ďaleko na dokončenie questu.');
              return;
            }
          } catch (err) {
            console.error('Fallback completion failed:', err);
            setError('Nepodarilo sa dokončiť quest ani cez QR ani cez aktiváciu na serveri.');
            return;
          }
        }

        // If we get here, no successful completion in private mode
        setError('Nepodarilo sa dokončiť súkromný quest. Skontroluj QR kód alebo skúste aktivovať quest na serveri.');
        return;
      }

      // Default/public flow: complete active quest via server endpoint
      const resp = await apiCompleteActiveQuest(position.lat, position.lng);
      if (resp && resp.status === 'completed') {
        const name = activeQuest.place;
        setActiveQuest(null);
        setQuests(prev => prev.map(q => ({ ...q, __active: false })));
        setNotification({ text: resp.message || `Dokončil si quest: ${name}`, type: 'success' });
        setTimeout(() => setNotification(null), 4500);
      } else if (resp && resp.status === 'too_far') {
        setError(resp.message || 'Príliš ďaleko na dokončenie questu.');
      } else {
        setError(resp.message || 'Nepodarilo sa dokončiť quest.');
      }
    } catch (err) {
      console.error('Error completing active quest:', err);
      setError('Chyba pri dokončovaní questu. Skús znova.');
    } finally {
      setActivationPending(false);
    }
  };

  // Loading screen
  if (geoLoading) {
    return <LoadingScreen message="Získavam tvoju polohu..." />;
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {/* Mode Selector Modal */}
      {showModeSelector && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999999] p-6 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full animate-slideUp z-[999999]">
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
        activeQuest={activeQuest}
      />

  {/* Weather Display */}
  {weather && <WeatherDisplay weather={weather} position={position} />}

      {/* Notification Banner (shows briefly when something happens) */}
      {notification && (
        <div className={`fixed left-1/2 -translate-x-1/2 top-20 ${notification.type === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-500' : notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'} text-white px-5 py-3 rounded-full shadow-xl z-[100000] flex items-center gap-3 max-w-[90%] animate-slideDown`}>
          <div className="text-2xl">{notification.type === 'success' ? '✅' : notification.type === 'warning' ? '⚠️' : 'ℹ️'}</div>
          <p className="text-sm font-medium leading-snug">{notification.text}</p>
        </div>
      )}

      {/* Player profile button (opens simple profile modal) */}
      <div className="fixed top-5 right-5 z-[100001]">
        <button
          onClick={() => setShowProfile(true)}
          className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-lg border border-gray-200"
          aria-label="Open profile"
        >
          👤
        </button>
      </div>

      {/* Shop floating button */}
      <div className="fixed top-5 right-20 z-[100001]">
        <button
          onClick={() => setShowShop(true)}
          className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-lg border border-gray-200"
          aria-label="Open shop"
          title="Obchod"
        >
          🛒
        </button>
      </div>

      {showProfile && (
        <ProfileModal key={profileKey} onClose={() => setShowProfile(false)} />
      )}

      {showShop && (
        <ShopModal
          onClose={() => setShowShop(false)}
          onPurchaseSuccess={() => {
            // bump profileKey so ProfileModal remounts and reloads player if it's open
            setProfileKey(k => k + 1);
            setNotification({ text: 'Nákup uskutočnený', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
          }}
          playerGeobucks={null}
        />
      )}

      {/* Control row - mobile-first horizontal layout just above bottom panel */}
      <div className="fixed right-4 bottom-[140px] z-[100000] flex items-center gap-2">
        {/* Zoom In */}
        <button
          onClick={() => {
            const mapEl = document.querySelector('.leaflet-container');
            if (mapEl && mapEl._leaflet_map) {
              mapEl._leaflet_map.zoomIn();
            }
          }}
          className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl text-gray-700 border border-gray-200 hover:scale-105 transition"
          aria-label="Zoom in"
        >
          +
        </button>
        
        {/* Zoom Out */}
        <button
          onClick={() => {
            const mapEl = document.querySelector('.leaflet-container');
            if (mapEl && mapEl._leaflet_map) {
              mapEl._leaflet_map.zoomOut();
            }
          }}
          className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl text-gray-700 border border-gray-200 hover:scale-105 transition"
          aria-label="Zoom out"
        >
          −
        </button>

        {/* Center on Player */}
        <button
          onClick={() => {
            if (position) {
              setMapCenter([position.lat, position.lng]);
            }
          }}
          disabled={!position}
          className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-lg text-gray-700 border border-gray-200 hover:scale-105 transition disabled:opacity-50"
          aria-label="Center on player"
        >
          📍
        </button>
        
        {/* Mode-specific buttons */}
        {mode === 'default' ? (
          <button
            onClick={() => setShowModeSelector(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg px-3 h-11 transition"
          >
            <span className="text-lg">🚀</span>
            <span className="hidden sm:inline font-semibold text-sm">Explore</span>
          </button>
        ) : (
          <>
            {/* Exit - icon only on mobile, icon + text on sm+ */}
            <button
              onClick={handleExitMode}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg px-3 h-11 transition"
            >
              <span className="text-lg">🚪</span>
              <span className="hidden sm:inline font-semibold text-sm">Exit</span>
            </button>
            
            {/* Refresh - only in public mode */}
            {mode === 'public' && (
              <button
                onClick={() => {
                  if (position) {
                    setLoading(true);
                    fetchQuests(position.lat, position.lng)
                      .then(data => {
                        const incoming = data.all_quests || [];
                        if (activeQuest) {
                          const merged = incoming.map(q => ({ ...q, __active: (
                            String(q.place) === String(activeQuest.place) && Number(q.lat) === Number(activeQuest.lat) && Number(q.lon) === Number(activeQuest.lon)
                          ) }));
                          setQuests(merged);
                        } else {
                          if (data.active_quest) setActiveQuest(data.active_quest);
                          const merged = incoming.map(q => ({ ...q, __active: (data.active_quest && String(q.place) === String(data.active_quest.place) && Number(q.lat) === Number(data.active_quest.lat) && Number(q.lon) === Number(data.active_quest.lon)) }));
                          setQuests(merged);
                        }
                        setAiMessage(data.ai_message);
                        if (!activeQuest && data.active_quest?.weather) {
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
                className="w-11 h-11 bg-white rounded-xl shadow-lg flex items-center justify-center text-lg text-gray-700 border border-gray-200 hover:scale-105 transition disabled:opacity-50"
              >
                {loading ? '⏳' : '🔄'}
              </button>
            )}
          </>
        )}
      </div>

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
          onStart={(q) => handleStartQuest(q)}
        />
      )}

      {/* Bottom Info Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/98 backdrop-blur-sm border-t border-gray-200 py-3 px-5 flex flex-col gap-2 z-[100000] shadow-2xl">
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
          <span className="text-lg">📍</span>
          <span className="text-sm text-gray-800 font-medium flex-1 truncate">
            {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Získavam polohu...'}
          </span>
        </div>
        {activationPending ? (
          <div className="flex items-center gap-3 bg-yellow-200 text-yellow-900 rounded-lg px-3 py-2">
            <span className="text-lg">⏳</span>
            <span className="text-sm font-semibold">Aktivujem quest...</span>
          </div>
        ) : activeQuest ? (
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg px-3 py-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-bold flex-1 truncate">Aktívny: {activeQuest.place}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCompleteQuest}
                className="ml-2 bg-white/90 text-amber-600 hover:bg-white px-3 py-1 rounded-lg font-semibold text-sm shadow-sm"
              >
                Dokončiť
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white/90 rounded-lg px-3 py-2">
            <span className="text-lg">ℹ️</span>
            <span className="text-sm text-gray-700">Zatiaľ nič nezvolené</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
