const QuestModal = ({ quest, onClose, onStart }) => {
  if (!quest) return null;

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
              <h2 className="text-lg font-semibold text-gray-900 truncate">📍 {quest.place}</h2>
              <p className="text-xs text-gray-500 mt-1">{quest.short_description || ''}</p>
            </div>
            <button
              className="ml-3 text-gray-500 hover:text-gray-800"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4 text-sm text-gray-800">
          <div className="flex gap-3 items-start">
            <div className="text-2xl">🎯</div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Úloha</h3>
              <p className="text-sm">{quest.goal}</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="text-2xl">💎</div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Odmena</h3>
              <p className="text-sm font-bold text-blue-600">{quest.reward}</p>
            </div>
          </div>

          {quest.educational_info && (
            <div className="flex gap-3 items-start">
              <div className="text-2xl">📚</div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Zaujímavosť</h3>
                <p className="text-sm">{quest.educational_info}</p>
              </div>
            </div>
          )}

          {quest.weather && (
            <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-xl">
              <div className="text-2xl">🌤️</div>
              <div className="flex-1 text-sm">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Počasie</h3>
                <p>{quest.weather.condition_text}, {Math.round(quest.weather.temperature)}°C</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-6 space-y-3">
          <button
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white py-3 rounded-xl font-semibold shadow-lg transition"
            onClick={() => { if (typeof onStart === 'function') onStart(quest); onClose(); }}
          >
            🚀 Začať quest
          </button>

          <button
            className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold shadow-sm"
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
