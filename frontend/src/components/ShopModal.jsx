import { useEffect, useState } from 'react';
import { getShop, buyShopItem, getPlayer } from '../utils/api';
import { FaRobot, FaAward, FaBox } from 'react-icons/fa';
import { FiCloud, FiMap, FiX } from 'react-icons/fi';

function iconFor(name) {
  if (!name) return <FaBox />;
  const n = name.toLowerCase();
  if (n.includes('ai')) return <FaRobot />;
  if (n.includes('weather')) return <FiCloud />;
  if (n.includes('unlock') || n.includes('hidden')) return <FiMap />;
  if (n.includes('badge') || n.includes('exclusive')) return <FaAward />;
  return <FaBox />;
}

export default function ShopModal({ onClose, onPurchaseSuccess, playerGeobucks = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState({});
  const [message, setMessage] = useState(null);
  const [player, setPlayer] = useState(null);

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

  // Load player info to determine affordability
  useEffect(() => {
    let mounted = true;
    const loadPlayer = async () => {
      try {
        const p = await getPlayer();
        if (!mounted) return;
        setPlayer(p || null);
      } catch (err) {
        console.error('Error loading player in shop:', err);
      }
    };
    loadPlayer();
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
        // refresh player balance after successful purchase
        try {
          const p = await getPlayer();
          setPlayer(p || null);
        } catch (e) {
          console.warn('Could not refresh player after purchase', e);
        }
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
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900"><FiX /></button>
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
              const available = player?.geobucks ?? playerGeobucks ?? 0;
              const unaffordable = (it.cost || 0) > available;
              return (
                <div key={idx} className="p-3 bg-gray-50 rounded flex flex-col justify-between h-full border-2 border-black">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 flex items-center justify-center bg-white rounded-full text-2xl shadow-sm">{iconFor(it.name)}</div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2 justify-center">
                      <img src="/geobucks.svg" alt="GeoBucks" className="w-4 h-4" />
                      <span className="font-semibold">{it.cost}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2 text-center">{unaffordable ? 'Nedostatok prostriedkov' : ''}</div>
                    <button
                      onClick={() => handleBuy(it)}
                      disabled={!!busy[it.name] || unaffordable}
                      className={`w-full py-2 rounded text-sm ${busy[it.name] || unaffordable ? 'bg-gray-200 text-gray-600' : 'bg-[#8D9F53] text-white'}`}>
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
