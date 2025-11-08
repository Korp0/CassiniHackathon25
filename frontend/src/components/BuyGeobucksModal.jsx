import { useState } from 'react';
import { buyGeobucks } from '../utils/api';
import { FiX, FiCreditCard } from 'react-icons/fi';

export default function BuyGeobucksModal({ onClose, onPurchaseSuccess }) {
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const presets = [100, 500, 1000];

  const handleBuy = async (amt) => {
    setError(null);
    setLoading(true);
    try {
      const resp = await buyGeobucks(amt);
      // Backend may return { status: 'ok', geobucks: X, message }
      if (resp && (resp.status === 'ok' || resp.success)) {
        if (onPurchaseSuccess) onPurchaseSuccess(resp);
        onClose();
      } else if (resp && resp.message) {
        setError(resp.message);
      } else {
        setError('Nastala chyba pri nákupe GeoBucks.');
      }
    } catch (err) {
      console.error('Buy geobucks failed', err);
      setError('Nastala chyba pri nákupe. Skús znova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999999] p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Kúpiť GeoBucks</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <FiX />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">Vyber sumu GeoBucks, ktorú chceš kúpiť.</p>

        <div className="flex gap-3 mb-4">
          {presets.map(p => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`flex-1 py-2 rounded-lg border ${amount === p ? 'border-green-500 bg-green-50' : 'border-gray-200'} text-sm flex items-center justify-center gap-2`}
            >
              <span>{p}</span>
              <img src="/geobucks.svg" alt="GB" className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="flex-1 px-3 py-2 border rounded-lg" />
          <img src="/geobucks.svg" alt="GB" className="w-5 h-5" />
        </div>

        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleBuy(amount)}
            disabled={loading || !amount}
            className="flex-1 bg-[#8D9F53] hover:bg-[#8D9F53] text-white py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <FiCreditCard />
            <span className="flex items-center gap-2">{loading ? 'Kupujem...' : <>Kúpiť {amount} <img src="/geobucks.svg" alt="GB" className="w-4 h-4 inline-block" /></>}</span>
          </button>
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Zrušiť</button>
        </div>
      </div>
    </div>
  );
}
