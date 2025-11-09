import { useEffect, useState } from 'react';
import { getPlayer } from '../utils/api';

export default function ProfileModal({ onClose }) {
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPlayer();
        if (!mounted) return;
        setPlayer(data || null);
      } catch (err) {
        console.error('Error loading player:', err);
        if (mounted) setError('Nepodarilo sa načítať údaje hráča.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // expose a reload function so shop can refresh player after purchase
  const reloadPlayer = async () => {
    try {
      setLoading(true);
      const data = await getPlayer();
      setPlayer(data || null);
    } catch (err) {
      console.error('Error reloading player:', err);
      setError('Nepodarilo sa obnoviť údaje hráča.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100001] p-6">
        <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-bold">Profil hráča</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

        <div className="mt-4">
          {loading && <p className="text-sm text-gray-600">Načítavam...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {player && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center p-1">
                  <img src="/avatar.svg" alt="Avatar" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-semibold">{player.name}</div>
                  <div className="text-sm text-gray-500">Level {player.level}</div>
                </div>
              </div>

              <div className="bg-red-50 rounded-md p-3">
                <div className="text-sm text-gray-600">XP</div>
                <div className="font-mono font-semibold flex items-center gap-2">
                  <img src="/xp.svg" alt="XP" className="w-5 h-5" />
                  <span>{player.xp} XP</span>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-md p-3">
                <div className="text-sm text-gray-600">GeoBucks</div>
                <div className="font-mono font-semibold flex items-center gap-2">
                  <img src="/geobucks.svg" alt="GeoBucks" className="w-5 h-5" />
                  <span>{player.geobucks ?? 0}</span>
                </div>
              </div>

              <div className="text-sm text-gray-700">
                ID: <span className="font-mono">{player.id}</span>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex-1 bg-[#8D9F53] text-white py-2 rounded-lg text-sm"
                >
                  Detail
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm"
                >
                  Zavrieť
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100001] p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">Detailný profil</h4>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDetails(false)} className="text-sm text-gray-600">Zatvoriť</button>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <div className="text-gray-500">ID</div>
                <div className="font-mono">{player?.id}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-gray-500">Meno</div>
                <div className="font-semibold">{player?.name}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-gray-500">Level</div>
                <div>{player?.level}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-gray-500">XP</div>
                <div className="flex items-center gap-2"><img src="/xp.svg" alt="XP" className="w-4 h-4" />{player?.xp} XP</div>
              </div>
              <div className="flex justify-between">
                <div className="text-gray-500">Geobucks</div>
                <div className="font-semibold flex items-center gap-2"><img src="/geobucks.svg" alt="GeoBucks" className="w-4 h-4" />{player?.geobucks ?? 0}</div>
              </div>

              <div>
                <div className="text-gray-500">Aktívny quest</div>
                {player?.active_quest ? (
                  <div className="mt-2 bg-gray-50 p-3 rounded">
                    <div className="font-medium">{player.active_quest.place || 'Miesto'}</div>
                    <div className="text-xs text-gray-500">{player.active_quest.goal || ''}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-gray-500">Žiadny aktívny quest</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop is now a global floating button in the app; opening handled by App.jsx */}
    </>
  );
}
