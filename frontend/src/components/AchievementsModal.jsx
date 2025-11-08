import { useEffect, useState } from 'react';
import { FiX, FiCheckCircle, FiLock } from 'react-icons/fi';
import { FaAward } from 'react-icons/fa';
import { getAchievements, getPlayer } from '../utils/api';

export default function AchievementsModal({ onClose }) {
  const [achievements, setAchievements] = useState([]);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [achResp, playerResp] = await Promise.all([getAchievements(), getPlayer()]);
        if (!mounted) return;
        const achList = (achResp && achResp.achievements) ? achResp.achievements : [];
        setAchievements(achList);
        setPlayer(playerResp || null);
      } catch (err) {
        console.error('Error loading achievements or player:', err);
        if (mounted) setError('Nepodarilo sa načítať achievements.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Compute progress for supported achievement ids
  const computeProgress = (ach) => {
    const p = player || { progress: {}, level: 0 };
    const prog = p.progress || {};
    const id = ach.id;
    let value = 0;
    let total = 1;
    let label = '';

    if (id === 'walk_10km') {
      // assume distance_walked is in meters
      total = 10000;
      value = Number(prog.distance_walked || 0);
      const vKm = (value / 1000).toFixed(1);
      label = `${vKm} km / ${(total/1000)} km`;
    } else if (id === 'reach_lvl_5') {
      total = 5;
      value = Number(p.level || 0);
      label = `Level ${value} / ${total}`;
    } else if (id === 'finish_10_quests') {
      total = 10;
      value = Number(prog.quests_completed || 0);
      label = `${value} / ${total} quests`;
    } else {
      // fallback: if achievement contains a numeric target use that
      if (ach.target) {
        total = Number(ach.target) || 1;
        value = Number(prog[ach.target_key] || 0) || 0;
        label = `${value} / ${total}`;
      } else {
        value = ach.unlocked ? total : 0;
        label = ach.unlocked ? '100%' : '0%';
      }
    }

    const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : (ach.unlocked ? 100 : 0);
    return { value, total, percent, label };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100002] p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2"><FaAward /> Achievements</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><FiX /></button>
        </div>

        <div>
          {loading && <div className="text-sm text-gray-600">Načítavam...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && (
            <div className="grid grid-cols-1 gap-3">
              {achievements.map(a => {
                const unlocked = Boolean(a.unlocked);
                const prog = computeProgress(a);
                return (
                  <div key={a.id} className="p-3 border-2 border-black rounded-md">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-full">
                        {a.icon ? <img src={a.icon} alt={a.name} className="w-8 h-8" /> : <FaAward />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">{a.name}</div>
                          <div className="text-xs">
                            {unlocked ? <FiCheckCircle className="text-green-600" /> : <FiLock className="text-gray-400" />}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">{a.description}</div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-gray-600">{prog.label}</div>
                            <div className="text-xs font-mono text-gray-700">{prog.percent}%</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                            <div className={`${unlocked ? 'bg-green-600' : 'bg-emerald-500'} h-2`} style={{ width: `${prog.percent}%`, transition: 'width 300ms' }} />
                          </div>
                        </div>

                        <div className="text-sm text-gray-700 mt-3 flex items-center gap-2">Odmena: <img src="/geobucks.svg" alt="GB" className="w-4 h-4" /> <span className="font-semibold">{a.reward_geobucks}</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
