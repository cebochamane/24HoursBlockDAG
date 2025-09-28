import { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { web3Service } from "../lib/web3";
import { addToast } from "../lib/toast";

export default function MyBets() {
  const [address, setAddress] = useState("");
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastStatuses, setLastStatuses] = useState({});

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        // Try to reuse known address (guest or wallet)
        const guest = localStorage.getItem("guest_address_v1");
        let addr = guest || address;
        if (!addr) {
          try {
            addr = await web3Service.connectWallet();
          } catch {}
        }
        if (!addr) return;
        if (!mounted) return;
        setAddress(addr);
        setLoading(true);
        const data = await apiClient.getUserBets(addr);
        if (!mounted) return;
        const items = data.items || [];
        // Detect transitions from pending -> won/lost and toast
        const nextStatuses = { ...lastStatuses };
        for (const b of items) {
          const key = String(b.id);
          const prev = lastStatuses[key];
          if (prev && prev === 'pending' && (b.status === 'won' || b.status === 'lost')) {
            addToast({ message: b.status === 'won' ? `You WON (ZAR ${Number(b.payout_amount||0).toFixed(2)})` : `You LOST`, type: b.status === 'won' ? 'success' : 'error' });
          }
          nextStatuses[key] = b.status;
        }
        setLastStatuses(nextStatuses);
        setBets(items);
      } catch (e) {
        console.warn("MyBets load failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
    const id = setInterval(init, 15000); // refresh every 15s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="w-[700px] max-w-[90vw] bg-white/10 border border-white/20 rounded-lg p-4 text-white">
      <div className="text-sm pb-2">{address ? `Address: ${address}` : "Connect or continue to see your bets"}</div>
      {loading && <div className="text-xs opacity-80">Loading bets…</div>}
      {!loading && bets.length === 0 && (
        <div className="text-xs opacity-80">No bets yet.</div>
      )}
      {!loading && bets.length > 0 && (
        <div className="space-y-2">
          {bets.map((b) => (
            <div key={b.id} className="bg-white/5 rounded-md p-2 text-xs">
              <div><strong>Market:</strong> {b.market_id}</div>
              <div><strong>Side:</strong> {b.side}</div>
              <div><strong>Amount:</strong> ZAR {Number(b.amount).toFixed(2)}</div>
              <div><strong>Status:</strong> {b.status}</div>
              <div><strong>Payout:</strong> ZAR {Number(b.payout_amount || 0).toFixed(2)}</div>
              <div><strong>Placed:</strong> {new Date(b.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
