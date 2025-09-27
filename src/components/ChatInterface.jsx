import { useState } from "react";

const ChatInterface = ({}) => {
    const [messages, setMessages] = useState([
        {sender: "ai", text: "Hey There! How can I help you?"},
        {sender: "user", text: "Hey There! I am here if you need any help with betting."}
    ])
    const [textPrompt, setTextPrompt] = useState("");

    function addMessageAndSendToAI(){
        if (textPrompt.trim() != ""){
            //Add our prompt to the chat
            const newMessage = {
                sender: "user",
                text: textPrompt
            }
            setMessages([...messages, newMessage]);
            setTextPrompt("");
            //Ask the LLM and get a response.
        }
    }

    return (
        <div>
            <div className="flex justify-center items-center pt-5 px-5">
                {/*Chat space */}
                <div className="bg-gradient-to-r from-cyan-300 to-blue-800 rounded-xl shadow-lg  overflow-y-auto h-100 w-200 p-4">
                    {/*Add the messages */}
                    {messages.map((msg) => (
                        <div className={`flex ${msg.sender == "user" ? "justify-end" : "justify-start"}  p-2`}>
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