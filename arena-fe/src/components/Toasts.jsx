import { useEffect, useState } from 'react';
import { subscribe, getToasts } from '../lib/toast';

export default function Toasts() {
  const [toasts, setToasts] = useState(getToasts());

  useEffect(() => {
    const unsub = subscribe(setToasts);
    return () => unsub();
  }, []);

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto rounded-md px-3 py-2 text-sm shadow-lg border ${t.type === 'success' ? 'bg-green-600 text-white border-green-400/60' : t.type === 'error' ? 'bg-red-600 text-white border-red-400/60' : 'bg-white text-black border-black/20'}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
