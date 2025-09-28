//Holds the card consisting of a prediction poll and options.
//Uzair Mohammed
//27/09/2025

import {useEffect, useMemo, useState} from 'react'
import { apiClient } from '../lib/api'
import { web3Service } from '../lib/web3'

const BetBox = ({
    marketId,
    title_poll,
    deadline,
    marketStatus,
    marketOutcome
}) => {
    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState("");
    const [betWin, setBetWin] = useState("");
    const [userAddress, setUserAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [lastAI, setLastAI] = useState(null);
    const [lastTx, setLastTx] = useState("");
    const [now, setNow] = useState(Date.now());
    const [error, setError] = useState("");

    // countdown
    const remaining = useMemo(() => {
        if (!deadline) return null;
        try {
            const d = new Date(deadline).getTime();
            const ms = d - now;
            if (isNaN(ms)) return null;
            return ms;
        } catch (e) { return null; }
    }, [deadline, now]);

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const formatRemaining = (ms) => {
        if (ms == null) return null;
        if (ms <= 0) return 'Closed';
        const s = Math.floor(ms/1000);
        const hh = Math.floor(s/3600);
        const mm = Math.floor((s%3600)/60);
        const ss = s%60;
        return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`;
    }


    function btnToggle(toggleSource){   
        if (isClosed()) return; // ignore clicks when closed
        if (toggleSource == "YES"){
            //Yes button was toggeled.
            if (selected == "YES"){
                //Disselect
                setSelected(null);
                //Remove pricing prediction.
                setAmount("");
            }
            else{
                //Yes button is selected now.
                setSelected("YES");
                //Change bet win
            }
        }
        else{
            //No button was toggeled.
            if (selected == "NO"){
                //Disselect
                setSelected(null);
                //Remove pricing prediction.
                setAmount("");
            }
            else{
                //No button is selected now.
                setSelected("NO");
                //Change bet win
            }
        }
    }

    function isClosed() {
        if (remaining == null) return false;
        return remaining <= 0;
    }

    function betChanged(e){
        setError("");
        const v = e.target.value;
        setAmount(v);
        const n = parseFloat(v);
        if (Number.isNaN(n) || n <= 0) {
            setBetWin("");
            return;
        }
        // Simple demo payout estimate (2x)
        setBetWin((n * 2).toFixed(2));
    }

    async function connectWallet(){
        try {
            const addr = await web3Service.connectWallet();
            setUserAddress(addr);
        } catch (e) {
            console.error(e);
            alert('Wallet connection failed: ' + e.message);
        }
    }

    async function placeBet(){
        if (!amount) return;
        setLoading(true);
        try {
            // Ensure wallet (for on-chain)
            let addr = userAddress;
            if (!addr) {
                addr = await web3Service.connectWallet();
                setUserAddress(addr);
            }

            // 1) Persist bet to backend for this market
            if (marketId && (selected === 'YES' || selected === 'NO')) {
                try {
                    await apiClient.createBet(marketId, { side: selected, amount: parseFloat(amount), userAddress: addr });
                } catch (e) {
                    console.warn('Bet persist failed (non-fatal):', e);
                }
            }

            // 2) Call backend to get AI reasoning (and trigger AI-bot tx)
            const backendResp = await apiClient.submitPrediction(addr, parseFloat(amount));
            setLastAI(backendResp);

            // 3) Submit on-chain user tx only if signer exists (handled in service)
            const txHash = await web3Service.submitPrediction(parseFloat(amount));
            setLastTx(txHash);
        } catch (e) {
            console.error(e);
            alert('Bet failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-gradient-to-r from-cyan-300 to-blue-800 rounded-xl text-center shadow-lg w-75 px-3 pb-5">
            {/* Header: title + status */}
            <div className="pt-5 pb-2 px-2">
                <div className="text-white font-medium">{title_poll}</div>
                {(marketStatus || marketOutcome) && (
                    <div className="flex items-center gap-2 pt-1">
                        {marketStatus && (
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${marketStatus === 'open' ? 'bg-green-600/40 border-green-400/60 text-white' : marketStatus === 'closed' ? 'bg-yellow-600/40 border-yellow-400/60 text-white' : 'bg-blue-700/40 border-blue-400/60 text-white'}`}>
                                {marketStatus}
                            </span>
                        )}
                        {marketStatus === 'resolved' && marketOutcome && (
                            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white/10 border-white/30 text-white">
                                Outcome: {marketOutcome}
                            </span>
                        )}
                    </div>
                )}
            </div>
            {remaining !== null && (
                <div className="text-white text-xs opacity-90 pb-1">Deadline in: {formatRemaining(remaining)}</div>
            )}

            {/*The Yes or No buttons */}
            <div className="flex justify-center gap-3 py-2">
                <button onClick={() => btnToggle("YES")} disabled={isClosed()}
                    className={`px-5 py-2 rounded-full font-semibold text-white ${selected == "YES" ? "bg-green-800" : "bg-green-500"} ${isClosed()? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg'}`}>
                    YES
                </button>
                <button onClick={() => btnToggle("NO")} disabled={isClosed()}
                    className={`px-5 py-2 rounded-full font-semibold text-white ${selected == "NO" ? "bg-red-800" : "bg-red-500"} ${isClosed()? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-lg'}`}>
                    NO
                </button>
            </div>
            {!selected && !isClosed() && (
                <div className="text-white text-xs opacity-90">Select YES or NO to continue</div>
            )}

            {/*Get the amount to be betted. Hidden if no option is selected. */}
            {selected && !isClosed() && (
                <div className="flex flex-col items-center gap-1 py-2">
                    <div className="flex justify-center gap-2">
                        <h3 className="text-white font-medium text-lg">ZAR</h3>
                        <input
                            type="number" min="0" step="0.01"
                            placeholder="0.00"
                            onChange={betChanged}
                            value={amount}
                            className="bg-white rounded-md text-center text-black font-medium w-28 text-lg focus:ring-1 focus:ring-blue-800 hover:shadow-lg"
                        />
                    </div>
                    <div className="text-white text-xs opacity-90">Enter your stake. Demo payout estimate is 2x.</div>
                    {error && (<div className="text-red-200 text-xs">{error}</div>)}
                </div>
            )}

            {/*Place bets button */}
            {selected && amount != "" && !isClosed() && (
                <div className="flex flex-col items-center gap-2 py-2">
                    {!userAddress && (
                        <button onClick={connectWallet} className="px-10 py-2 rounded-full font-semibold text-white bg-purple-700 hover:opacity-90 hover:shadow-lg">
                            {window?.ethereum ? 'Connect Wallet' : 'Continue (Guest Mode)'}
                        </button>
                    )}
                    <button disabled={loading} onClick={() => placeBet()}
                        className="px-10 py-2 rounded-full font-semibold text-white bg-black hover:opacity-80 hover:shadow-lg disabled:opacity-60">
                        <div className="text-sm">
                            {loading ? 'Placing Bet...' : 'Place Bet'}
                        </div>
                        <div className="text-xs">
                            Win: ZAR {betWin}
                        </div>
                    </button>
                    {userAddress && (
                        <div className="text-white text-xs">Connected: {userAddress.slice(0,6)}...{userAddress.slice(-4)}</div>
                    )}
                    {(lastAI || lastTx) && (
                        <div className="bg-white/10 border border-white/20 rounded-md text-white text-xs p-2 max-w-[320px] w-full">
                            {lastAI && (
                                <div className="pb-1">
                                    <div><strong>AI:</strong> <span className="opacity-90">{lastAI.ai_reasoning}</span></div>
                                    <div><strong>AI pred:</strong> {Number(lastAI.ai_prediction).toFixed(2)}</div>
                                </div>
                            )}
                            {lastTx && (
                                <div className="break-all"><strong>Tx:</strong> {lastTx}</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default BetBox