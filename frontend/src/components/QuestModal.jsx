const QuestModal = ({ quest, onClose }) => {
  if (!quest) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-5 animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slideUp" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="absolute top-4 right-4 bg-black/5 hover:bg-black/10 w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:rotate-90" 
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="px-6 pt-8 pb-5 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight">
            📍 {quest.place}
          </h2>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="flex gap-4 items-start">
            <div className="text-3xl leading-none flex-shrink-0">🎯</div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Úloha
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed">{quest.goal}</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="text-3xl leading-none flex-shrink-0">💎</div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Odmena
              </h3>
              <p className="text-lg font-bold text-blue-600">{quest.reward}</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="text-3xl leading-none flex-shrink-0">📚</div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Zaujímavosť
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed">{quest.educational_info}</p>
            </div>
          </div>

          {quest.weather && (
            <div className="flex gap-4 items-start bg-slate-50 p-4 rounded-xl mt-2">
              <div className="text-3xl leading-none flex-shrink-0">🌤️</div>
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Počasie na mieste
                </h3>
                <p className="text-sm text-gray-800">
                  {quest.weather.condition_text}, {Math.round(quest.weather.temperature)}°C
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-5 border-t border-gray-100">
          <button 
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0" 
            onClick={() => {
              alert(`Quest "${quest.place}" začína! Naviguj na miesto.`);
              onClose();
            }}
          >
            🚀 Začať quest
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestModal;
