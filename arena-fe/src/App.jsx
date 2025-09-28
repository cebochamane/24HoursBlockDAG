//Holds the main page of the website and all its components.
//Uzair Mohammed
//27/09/2025

import "./components/BetBox"
import BetBox from "./components/BetBox"
import ChatInterface from "./components/ChatInterface"
import MyBets from "./components/MyBets"
import Toasts from "./components/Toasts"
import { useEffect, useState } from "react"
import { apiClient } from "./lib/api"

function App() {
  const [price, setPrice] = useState(null);
  const [markets, setMarkets] = useState([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const p = await apiClient.getPriceData();
        if (mounted) setPrice(p);
        const m = await apiClient.getMarkets();
        if (mounted) setMarkets(m.items || []);
      } catch (e) {
        // non-fatal for UI
        console.warn("Price fetch failed", e);
      }
    };
    load();
    const id = setInterval(load, 60000); // refresh every 60s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="bg-gradient-to-b from-blue-900 to-black min-h-screen relative">
      <Toasts/>
      {/* Holds the price and heading*/}
      <div className = "flex justify-between items-center px-6 py-4">
        <h1 className = "text-left text-white font-bold text-5xl py-2">
          ETH-POLY
        </h1>
        <div className="flex flex-col items-end gap-1">
          <h1 className = "font-bold text-2xl text-white">An Ethereum Polymarket</h1>
          {price && (
            <span className="text-sm bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white">
              ETH ${price.current_price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

        {/* Insert the cards here as a grid */}
        <div className="flex flex-wrap justify-center gap-7 py-5">
          {markets.map(m => (
            <BetBox
              key={m.id}
              marketId={m.id}
              title_poll={m.title}
              deadline={m.deadline}
              marketStatus={m.status}
              marketOutcome={m.outcome}
            />
          ))}
        </div>

        {/*Get advice from the LLM */}
        <div className="flex flex-col items-center justify-center pt-10">
          <h1 className="font-bold text-white text-xl py-0.5 hover:opacity-85">Get Advice</h1>
          <div className="h-0.5 w-50 bg-gradient-to-r from-blue-700 to-purple-500 hover:bg-gradient-to-l hover:from-blue-700 hover:to-purple-500 hover:shadow-lg"></div>
        </div>

        <ChatInterface/>

        {/* My Bets */}
        <div className="flex flex-col items-center justify-center pt-10">
          <h1 className="font-bold text-white text-xl py-0.5 hover:opacity-85">My Bets</h1>
          <div className="h-0.5 w-50 bg-gradient-to-r from-blue-700 to-purple-500"></div>
        </div>
        <div className="flex justify-center py-4">
          <MyBets/>
        </div>

    </div>
  )
}

export default App