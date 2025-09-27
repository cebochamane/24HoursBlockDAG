//Holds the card consisting of a prediction poll and options.
//Uzair Mohammed
//27/09/2025

import {useState} from 'react'

const BetBox = ({
    title_poll
}) => {
    const [selected, setSelected] = useState(null);
    const [amount, setAmount] = useState("");
    const [betWin, setBetWin] = useState("");

    function btnToggle(toggleSource){   
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

    function betChanged(e){
        let value = e.target.value;
        if (value != ""){
            setAmount(value);
            //Get updated win.
            //For now just the same amount
            setBetWin(value);
        }
    }

    function placeBet(){

    }

    return (
        <div className="bg-gradient-to-r from-cyan-300 to-blue-800 rounded-xl text-center shadow-lg w-75 px-3 pb-5">
            {/*The betting question */}
            <div className="text-white font-medium pt-5 pb-2 px-2">
                {title_poll}
            </div>

            {/*The Yes or No buttons */}
            <div className="flex justify-center gap-3 py-2">
                <button onClick = {() => btnToggle("YES")}
                    className={`px-5 py-2 rounded-full font-semibold text-white ${selected == "YES" ? "bg-green-800" : "bg-green-500"} hover:opacity-90 hover:shadow-lg`}>
                    YES
                </button>

                <button onClick = {() => btnToggle("NO")}
                    className={`px-5 py-2 rounded-full font-semibold text-white ${selected == "NO" ? "bg-red-800" : "bg-red-500"} hover:opacity-90 hover:shadow-lg`}>
                    NO
                </button>
            </div>

            {/*Get the amount to be betted. Hidden if no option is selected. */}
            {selected && (
                <div className="flex justify-center gap-2 py-2">
                    <h3 className="text-white font-medium text-lg">ZAR</h3>
                    <input
                        placeholder="0.00"
                        onChange={(e) => betChanged(e)}
                        className="bg-white rounded-md text-center text-black font-medium w-22
                        text-lg focus:ring-1 focus:ring-blue-800 hover:shadow-lg
                        "
                    />
                </div>
            )}

            {/*Place bets button */}
            {selected && amount != "" && (
                <div className="flex justify-center py-2">
                    <button onClick = {() => placeBet()}
                        className="px-10 py-2 rounded-full font-semibold text-white bg-black hover:opacity-80 hover:shadow-lg">
                        <div className="text-sm">
                            Place Bet
                        </div>
                        <div className="text-xs">
                            Win: ZAR {betWin}
                        </div>
                    </button>
                </div>
            )}
        </div>
    )
}

export default BetBox