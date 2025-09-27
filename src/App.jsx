//Holds the main page of the website and all its components.
//Uzair Mohammed
//27/09/2025

import "./components/BetBox"
import BetBox from "./components/BetBox"

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
          <h1 className="font-bold text-white text-xl py-0.5">Predict and Win</h1>

          <div className="h-0.5 w-50 bg-gradient-to-r from-blue-700 to-purple-500"></div>
        </div>

        {/* Insert the cards here as a grid */}
        <div className="grid justify-items-center gap-5">
          <BetBox 
            title_poll={"Hello"}
          />
                    <BetBox 
            title_poll={"Hello"}
          />
        </div>
    </div>
  )
}

export default App