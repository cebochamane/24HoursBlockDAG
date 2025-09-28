import { useState } from "react";
import { apiClient } from "../lib/api";

const ChatInterface = ({}) => {
    const [messages, setMessages] = useState([
        {sender: "ai", text: "Hey There! How can I help you?"}
    ])
    const [textPrompt, setTextPrompt] = useState("");
    // Use a known-valid local Hardhat address so backend validation passes when reusing /predict
    const fallbackAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    async function addMessageAndSendToAI(){
        if (textPrompt.trim() != ""){
            //Add our prompt to the chat
            const newMessage = {
                sender: "user",
                text: textPrompt
            }
            setMessages([...messages, newMessage]);
            const promptCopy = textPrompt;
            setTextPrompt("");
            try {
                // Quick probe: ensure backend reachable
                try {
                    const h = await apiClient.healthCheck();
                    // optional log to console
                    console.log('[Chat] health:', h);
                } catch (e) {
                    console.error('[Chat] health failed:', e);
                    setMessages((prev) => [
                        ...prev,
                        { sender: "ai", text: `Backend health check failed: ${e.message}` }
                    ]);
                    return;
                }
                // Use dedicated chat endpoint
                const resp = await apiClient.chat(promptCopy);
                const aiMsg = { sender: "ai", text: resp.message };
                setMessages((prev) => [...prev, aiMsg]);
            } catch (e) {
                console.error(e);
                setMessages((prev) => [...prev, { sender: "ai", text: `Sorry, I encountered an error: ${e.message}` }]);
            }
        }
    }

    return (
        <div>
            <div className="flex justify-center items-center pt-5 px-5">
                {/*Chat space */}
                <div className="bg-gradient-to-r from-cyan-300 to-blue-800 rounded-xl shadow-lg  overflow-y-auto h-100 w-200 p-4">
                    {/*Add the messages */}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender == "user" ? "justify-end" : "justify-start"}  p-2`}>
                            <div className="max-w-xs rounded-lg p-2 bg-white text-black font-medium">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/*Chat input area */}
            <div className="flex justify-center gap-3 pt-2 px-5 pb-5">
                <input
                    placeholder="Ask me something..."
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    onKeyDown={(e) => e.key == "Enter" && addMessageAndSendToAI()}
                    className="bg-white rounded-3xl text-black w-100 p-2 focus:ring-1 focus:ring-blue-800 hover:shadow-lg"
                />

                <button
                    onClick={addMessageAndSendToAI}
                    className="rounded-4xl bg-gradient-to-r from-blue-900 to-purple-400 px-4 text-white font-medium
                    hover:opacity-90 hover:shadow-lg
                    "
                >
                    Send 
                </button>
            </div>
        </div>        
    )
}

export default ChatInterface