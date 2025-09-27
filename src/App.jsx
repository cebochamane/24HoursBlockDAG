//Holds the main page of the website and all its components.
//Uzair Mohammed
//27/09/2025

import "./components/BetBox"
import BetBox from "./components/BetBox"
import ChatInterface from "./components/ChatInterface"

function App() {
  return (
    <div className="font-arial min-h-screen bg-gradient-to-b from-blue-900 to-blue-400">
        {/*The Header/Navigation*/}
        <div className = "flex justify-between items-center">
          <h1 className = "text-left text-white font-bold text-5xl py-6 px-12">
            ETH-POLY
          </h1>

          <h1 className = "text-right text-white py-6 px-12 font-bold text-2xl">
            An Etherium Polymarket
          </h1>
        </div>
        {/*Start of prediction cards*/}
        <div className="flex flex-col items-center justify-center">
          <h1 className="font-bold text-white text-xl py-0.5 hover:opacity-85">Predict and Win</h1>

          <div className="h-0.5 w-50 bg-gradient-to-r from-blue-700 to-purple-500 hover:bg-gradient-to-l hover:from-blue-700 hover:to-purple-500 hover:shadow-lg"></div>
        </div>

        {/* Insert the cards here as a grid */}
        <div className="flex flex-wrap justify-center gap-7 py-5">
          <BetBox 
            title_poll={"The price of ETH will increase by at least 75% by tonight at 7pm."}
          />
          
          <BetBox 
            title_poll={"The price of ETH will not change at all."}
          />

          <BetBox 
            title_poll={"The price of ETH will not change at all."}
          />

          <BetBox 
            title_poll={"The price of ETH will not change at all."}
          />

          <BetBox 
            title_poll={"The price of ETH will not change at all."}
          />
        </div>

        {/*Get advice from the LLM */}
        <div className="flex flex-col items-center justify-center pt-10">
          <h1 className="font-bold text-white text-xl py-0.5 hover:opacity-85">Get Advice</h1>

          <div className="h-0.5 w-50 bg-gradient-to-r from-blue-700 to-purple-500 hover:bg-gradient-to-l hover:from-blue-700 hover:to-purple-500 hover:shadow-lg"></div>
        </div>

        <ChatInterface/>

    </div>
  )
}

export default App