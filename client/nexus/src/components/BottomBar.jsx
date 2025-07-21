import { useNavigate } from "react-router-dom";
import "./BottomBar.css"
import { useState } from "react";

//added tts
function BottomBar({onEndCall,onToggleMute,isMuted,onToggleCamera, isCameraOff, chatIsOpen, setChatIsOpen, ttsText, setTtsText, handleTtsSend, onToggleCaption, isCaptionOn}){
    const [ttsOn, setTtsOn] = useState(false)
    
    return (<div className="parent-div">
        <div><button className="tts-btn" onClick={()=>setTtsOn(!ttsOn)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M9 2a8 8 0 0 1 7.934 6.965l2.25 3.539c.148.233.118.58-.225.728L17 14.07V17a2 2 0 0 1-2 2h-1.999L13 22H4v-3.694c0-1.18-.436-2.297-1.244-3.305A8 8 0 0 1 9 2m12.154 16.102l-1.665-1.11A8.96 8.96 0 0 0 21 12a8.96 8.96 0 0 0-1.51-4.993l1.664-1.11A10.95 10.95 0 0 1 23 12c0 2.258-.68 4.356-1.846 6.102"/></svg></button></div>
        <div className="bottom-bar">
            <button onClick={onToggleMute} title={isMuted? "Unmute Mic":"Mute Mic"}>
                {isMuted?(<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05zm-4 .16L9 5.18V5a3 3 0 0 1 3-3a3 3 0 0 1 3 3zM4.27 3L21 19.73L19.73 21l-4.19-4.19c-.77.46-1.63.77-2.54.91V21h-2v-3.28c-3.28-.49-6-3.31-6-6.72h1.7c0 3 2.54 5.1 5.3 5.1c.81 0 1.6-.19 2.31-.52l-1.66-1.66L12 14a3 3 0 0 1-3-3v-.72L3 4.27z"/></svg>)
                :(<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3m7 9c0 3.53-2.61 6.44-6 6.93V21h-2v-3.07c-3.39-.49-6-3.4-6-6.93h2a5 5 0 0 0 5 5a5 5 0 0 0 5-5z"/></svg>)}
            </button>
            <button onClick={onToggleCamera}>
                {isCameraOff? 
                (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3.41 1.86L2 3.27L4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.55-.18L19.73 21l1.41-1.41l-8.86-8.86zM5 16V8h1.73l8 8zm10-8v2.61l6 6V6.5l-4 4V7a1 1 0 0 0-1-1h-5.61l2 2z"/></svg>):
                (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M15 8v8H5V8zm1-2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4V7a1 1 0 0 0-1-1"/></svg>)
                }
            </button>
            <button onClick={onToggleCaption}>
                {isCaptionOn?(<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 14H5V6h14zM7 15h3c.55 0 1-.45 1-1v-1H9.5v.5h-2v-3h2v.5H11v-1c0-.55-.45-1-1-1H7c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1m7 0h3c.55 0 1-.45 1-1v-1h-1.5v.5h-2v-3h2v.5H18v-1c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1"/></svg>)
                :(<svg width="97" height="83" viewBox="0 0 97 83" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M28.1667 53.5H40.6667C42.9583 53.5 44.8333 51.625 44.8333 49.3333V45.1667H38.5833V47.25H30.25V34.75H38.5833V36.8333H44.8333V32.6667C44.8333 30.375 42.9583 28.5 40.6667 28.5H28.1667C25.875 28.5 24 30.375 24 32.6667V49.3333C24 51.625 25.875 53.5 28.1667 53.5ZM57.3333 53.5H69.8333C72.125 53.5 74 51.625 74 49.3333V45.1667H67.75V47.25H59.4167V34.75H67.75V36.8333H74V32.6667C74 30.375 72.125 28.5 69.8333 28.5H57.3333C55.0417 28.5 53.1667 30.375 53.1667 32.6667V49.3333C53.1667 51.625 55.0417 53.5 57.3333 53.5Z" fill="black"/>
<path d="M78.1667 7.66663H19.8333C17.6232 7.66663 15.5036 8.5446 13.9408 10.1074C12.378 11.6702 11.5 13.7898 11.5 16V66C11.5 68.2101 12.378 70.3297 13.9408 71.8925C15.5036 73.4553 17.6232 74.3333 19.8333 74.3333H78.1667C82.75 74.3333 86.5 70.5833 86.5 66V16C86.5 11.4166 82.75 7.66663 78.1667 7.66663ZM78.1667 66H19.8333V16H78.1667V66Z" fill="black"/>
<line x1="95.4256" y1="74.0614" x2="7.4256" y2="1.06145" stroke="white" stroke-width="8"/>
<line x1="91.4256" y1="79.0614" x2="3.4256" y2="5.06145" stroke="black" stroke-width="8"/>
</svg>
)}
            </button>
            <button className="end-call" onClick={onEndCall}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 13.478v-.616s0-1.466 4-1.466s4 1.466 4 1.466v.388c0 .956.723 1.77 1.7 1.912l2 .294c1.21.177 2.3-.73 2.3-1.913v-2.125c0-.587-.184-1.164-.63-1.562C20.23 8.837 17.42 7 12 7c-5.749 0-8.56 2.583-9.56 3.789c-.315.381-.44.864-.44 1.352v1.923c0 1.298 1.296 2.228 2.58 1.852l2-.587c.843-.247 1.42-.998 1.42-1.85"/></svg></button>
        </div>
        <div className={`tts-area ${ttsOn?"show":""}`}>
            <div><button className="minimize-button" onClick={()=>setTtsOn(!ttsOn)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="#000" d="M12.707 15.707a1 1 0 0 1-1.414 0L5.636 10.05A1 1 0 1 1 7.05 8.636l4.95 4.95l4.95-4.95a1 1 0 0 1 1.414 1.414z"/></g></svg></button></div>
            <div className="tts-input">
                <input type="text" placeholder="Type here..." value={ttsText} onChange={(e)=>setTtsText(e.target.value)}/>
                <button onClick={handleTtsSend}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M15 4.25v15.496c0 1.079-1.274 1.651-2.08.934l-4.492-3.994a.75.75 0 0 0-.498-.189H4.25A2.25 2.25 0 0 1 2 14.247V9.749A2.25 2.25 0 0 1 4.25 7.5h3.68a.75.75 0 0 0 .498-.19l4.491-3.993C13.726 2.6 15 3.172 15 4.25m3.992 1.648a.75.75 0 0 1 1.049.156A9.96 9.96 0 0 1 22 12.001a9.96 9.96 0 0 1-1.96 5.946a.75.75 0 0 1-1.205-.893a8.46 8.46 0 0 0 1.665-5.053a8.46 8.46 0 0 0-1.665-5.054a.75.75 0 0 1 .157-1.05M17.143 8.37a.75.75 0 0 1 1.017.302c.536.99.84 2.125.84 3.329a7 7 0 0 1-.84 3.328a.75.75 0 0 1-1.32-.714a5.5 5.5 0 0 0 .66-2.614c0-.948-.24-1.838-.66-2.615a.75.75 0 0 1 .303-1.016"/></svg></button>
            </div>
        </div>
        <div><button className="chat-btn" onClick={()=>setChatIsOpen(!chatIsOpen)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h8m-8 4h4m0 8c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.96 9.96 0 0 0 12 22"/></svg></button></div>
    </div>
    )
}

export default BottomBar;