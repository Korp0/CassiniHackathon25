import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { getLeaderboard } from '../utils/api';

export default function LeaderboardModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        if (!mounted) return;
        // Expecting data to contain an array `entries` or `leaderboard`
        const list = data?.entries || data?.leaderboard || data || [];
        setEntries(list);
      } catch (err) {
        console.error('Error loading leaderboard:', err);
        if (mounted) setError('Nepodarilo sa načítať leaderboard.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100002] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Leaderboard</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><FiX /></button>
        </div>

        <div>
          {loading && <div className="text-sm text-gray-600">Načítavam...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="flex flex-col gap-2">
              {entries.length === 0 && (
                <div className="text-sm text-gray-600">Žiadne údaje.</div>
              )}

              {entries.map((e, idx) => (
                <div key={e.id || e.name || idx} className="p-3 border-2 border-black rounded-md flex items-center gap-2">
                  <div className="w-10 flex items-center justify-center">
                    <div className="text-sm font-semibold text-gray-500">#{idx + 1}</div>
                  </div>

                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img src={e.avatar || (idx % 2 === 0 ? '/avatar.svg' : '/avatar2.svg')} alt={e.name || 'avatar'} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{e.name || e.player || 'Hráč'}</div>
                      <div className="text-xs text-gray-500">{e.country || e.city || ''}</div>
                    </div>
                    <div className="font-mono font-semibold flex items-center gap-2">
                      <img src="/xp.svg" alt="XP" className="w-4 h-4" />
                      <span>{e.score ?? e.geobucks ?? e.points ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
