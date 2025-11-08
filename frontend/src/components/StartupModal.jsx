import { useState } from 'react';

export default function StartupModal({ onExplore, onScan }) {
  const [mode, setMode] = useState(null); // null | 'explore' | 'scan'
  const [code, setCode] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 z-[200000] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Vitaj v Cassini Demo</h2>
        {!mode && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-600">Vyber jednu z možností:</p>
            <button
              className="w-full bg-gradient-to-r from-green-500 to-green-400 text-white py-3 rounded-xl font-semibold"
              onClick={() => { setMode('explore'); onExplore(); }}
            >
              Explore public
            </button>
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 rounded-xl font-semibold"
              onClick={() => setMode('scan')}
            >
              Scan QR code (demo)
            </button>
          </div>
        )}

        {mode === 'scan' && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-gray-600">Zadaj ID (qr code) miesta pre demo:</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="zadaj ID..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
            <div className="flex gap-3">
              <button
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium"
                onClick={() => onScan(code)}
              >
                Načítať miesto
              </button>
              <button
                className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-lg"
                onClick={() => setMode(null)}
              >
                Späť
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
