import { useEffect, useState } from "react";
import "./Chat.css"

const Chat=({socket,roomId,username})=>{
    const [message,setMessage] = useState("");
    const [messages,setMessages] = useState([]);
    
    useEffect(()=>{
        if(!socket) return;

        socket.on("receive-message",({message,sender})=>{
            setMessages((prev)=>[...prev,{message,sender}])
        });

        return ()=>{
            socket.off("receive-message");
        }
    },[socket]);

    const sendMessage = ()=>{
        if(message.trim()==="") return;

        socket.emit("send-message",{
            roomId,
            message,
            sender: username || "Anonymous"
        })

        setMessages((prev)=>[...prev,{message,sender:"You"}])
        setMessage("");    
    }
    return <>
        <div className="chat-panel">
            <div className="top-bar">
                <button><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"/></svg></button>
                {/* area here for the logo */}
            </div>
            <div className="chat-area">
                {messages.map((msg,index)=>(
                    <div key={index} className="chat-message">
                        <strong>{msg.sender}</strong>
                        <div className="message">
                            {msg.message}
                        </div>
                    </div>
                ))}
            </div>
            <div className="enter-message-div">
                <input type="text" 
                placeholder="Type here..." 
                value={message} 
                onKeyDown={(e)=>e.key === "Enter" && sendMessage()}
                onChange={(e)=>setMessage(e.target.value)}
                />
                <button className="send-message" onClick={sendMessage}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="m19.8 12.925l-15.4 6.5q-.5.2-.95-.088T3 18.5v-13q0-.55.45-.837t.95-.088l15.4 6.5q.625.275.625.925t-.625.925M5 17l11.85-5L5 7v3.5l6 1.5l-6 1.5zm0 0V7z"/></svg></button>
    
            </div>
        </div>
    </>
}

export default Chat;