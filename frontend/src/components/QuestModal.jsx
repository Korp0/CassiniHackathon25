import { useEffect, useState } from 'react';
import { checkWeatherForQuest } from '../utils/api';
import { FiMapPin, FiX, FiPlay, FiCloud, FiBook } from 'react-icons/fi';
import { FaBullseye, FaGem } from 'react-icons/fa';
import { FiShield } from 'react-icons/fi';

const QuestModal = ({ quest, onClose, onStart }) => {
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const runCheck = async () => {
      if (!quest || !quest.id) return;
      setChecking(true);
      try {
        const res = await checkWeatherForQuest(quest.id);
        if (!mounted) return;
        setCheckResult(res || null);
      } catch (err) {
        console.warn('Weather check failed:', err);
        if (mounted) setCheckResult(null);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    runCheck();
    return () => { mounted = false; };
  }, [quest]);

  if (!quest) return null;

  const suggested = checkResult?.suggested_quest || null;
  const isOkay = checkResult?.is_okay;

  return (
    // Overlay - click outside closes
    <div className="fixed inset-0 z-[100001]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Mobile-first bottom sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 mx-auto w-full max-w-2xl bg-white rounded-t-2xl shadow-2xl p-4 pt-2 max-h-[85vh] overflow-y-auto animate-slideUp z-[100002] sm:rounded-2xl sm:top-1/2 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />

        <div className="px-4 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 truncate"><FiMapPin className="inline mr-2" />{quest.place}</h2>
              <p className="text-xs text-gray-500 mt-1">{quest.short_description || ''}</p>
            </div>
            <button
              className="ml-3 text-gray-500 hover:text-gray-800"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4 text-sm text-gray-800">
          <div className="flex gap-3 items-start">
            <div className="text-2xl"><FaBullseye /></div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Úloha</h3>
              <p className="text-sm">{quest.goal}</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="text-2xl"><FaGem /></div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Odmena</h3>
              <p className="text-sm font-bold text-blue-600">{quest.reward}</p>
            </div>
          </div>

          {quest.educational_info && (
            <div className="flex gap-3 items-start">
              <div className="text-2xl"><FiBook /></div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Zaujímavosť</h3>
                <p className="text-sm">{quest.educational_info}</p>
              </div>
            </div>
          )}

          {quest.weather && (
            <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl">
              <div className="text-2xl"><FiCloud /></div>
              <div className="flex-1 text-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Počasie</h3>
                <p>{quest.weather.condition_text}, {Math.round(quest.weather.temperature)}°C</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-6 space-y-3">
          {/* Weather check result (if any) */}
          {checking && (
            <div className="p-3 text-sm text-gray-600">Kontrolujem počasie pre túto úlohu...</div>
          )}

          {checkResult && checkResult.is_okay === false && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <div className="font-semibold">Nie je vhodné počasie: {checkResult.reason}</div>
              {checkResult.ai_message && (
                <div className="mt-1 text-sm text-red-700">{checkResult.ai_message}</div>
              )}
            </div>
          )}

          <button
            className="w-full bg-[#8D9F53] hover:from-green-700 hover:to-green-600 text-white py-3 rounded-xl font-semibold shadow-lg transition"
            onClick={async () => { if (typeof onStart === 'function') await onStart(quest); onClose(); }}
          >
            <FiPlay className="inline mr-2" /> Začať quest
          </button>

          {/* If weather check suggested an alternative, show suggested quest button */}
          {checkResult && checkResult.is_okay === false && suggested && (
            <div className="space-y-2">
              <div className="text-sm text-red-700">Navrhovaný quest (lepšie počasie):</div>
              <button
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold shadow-lg transition flex items-center justify-center gap-3"
                onClick={async () => { if (typeof onStart === 'function') await onStart(suggested); onClose(); }}
              >
                <FiShield className="inline mr-2" /> {suggested.place}
              </button>
            </div>
          )}

          <button
            className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold shadow-sm"
            onClick={onClose}
          >
            Zatvoriť
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestModal;
