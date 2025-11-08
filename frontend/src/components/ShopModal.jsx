import { useEffect, useState } from 'react';
import { getShop, buyShopItem } from '../utils/api';

function emojiFor(name) {
  if (!name) return '📦';
  if (name.toLowerCase().includes('ai')) return '🤖';
  if (name.toLowerCase().includes('weather')) return '☂️';
  if (name.toLowerCase().includes('unlock') || name.toLowerCase().includes('hidden')) return '🗺️';
  if (name.toLowerCase().includes('badge') || name.toLowerCase().includes('exclusive')) return '🏅';
  return '✨';
}

export default function ShopModal({ onClose, onPurchaseSuccess, playerGeobucks = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await getShop();
        if (!mounted) return;
        setItems((data && data.items) || []);
      } catch (err) {
        console.error('Error loading shop:', err);
        if (mounted) setError('Nepodarilo sa načítať obchod.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleBuy = async (item) => {
    setMessage(null);
    setBusy((s) => ({ ...s, [item.name]: true }));
    try {
      const res = await buyShopItem(item.name);
      if (res && res.error) {
        setMessage({ type: 'error', text: res.error });
      } else {
        const text = res && res.message ? res.message : `Kúpili ste ${item.name}.`;
        setMessage({ type: 'success', text });
        if (onPurchaseSuccess) onPurchaseSuccess(res);
      }
    } catch (err) {
      console.error('Buy failed', err);
      setMessage({ type: 'error', text: 'Nákup sa nepodaril.' });
    } finally {
      setBusy((s) => ({ ...s, [item.name]: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100001] p-6">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Obchod</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">✕</button>
        </div>

        <div className="mt-4">
          {loading && <p className="text-sm text-gray-600">Načítavam položky...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && (
            <div className={`p-2 rounded mt-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}
          {!loading && !error && items.length === 0 && <p className="text-sm text-gray-500">Obchod je prázdny.</p>}

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 items-stretch">
            {items.map((it, idx) => {
              const unaffordable = (it.cost || 0) > (playerGeobucks ?? 0);
              return (
                <div key={idx} className="p-3 bg-gray-50 rounded flex flex-col justify-between h-full">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-2xl shadow-sm">{emojiFor(it.name)}</div>
                    <div className="flex-1">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-gray-500">Cena: {it.cost} 🪙</div>
                    </div>
                  </div>

                  <div className="mt-3 w-full flex items-center justify-between">
                    <div className="text-xs text-gray-500">{unaffordable ? 'Nedostatok prostriedkov' : ''}</div>
                    <button
                      onClick={() => handleBuy(it)}
                      disabled={!!busy[it.name] || unaffordable}
                      className={`py-1 px-3 rounded text-sm ${busy[it.name] || unaffordable ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'}`}>
                      {busy[it.name] ? 'Kupujem…' : 'Kúpiť'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
