import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {v1 as uuid} from "uuid";
import "./HomePage.css"
// import NexusLogo from "../assets/NexusLogo.svg?react";


const HomePage = ()=>{

    const [name, setName] = useState();
    const [roles,setRoles] = useState([]);
    const [searchParams] = useSearchParams();
    const redirectRoom = searchParams.get("redirectRoom");
    const [meetingCode, setMeetingCode] = useState("");

    const navigate = useNavigate()
    function create(){
        const id = uuid(); //create an id

        if (!name) {
            alert("Please enter your name");
            return;
        }
        sessionStorage.setItem("username",name);
        sessionStorage.setItem("role",JSON.stringify(roles));
        navigate(`/room/${id}`); //go to that room
    }
    function joinMeeting(){
        if(!name){
            alert("Please enter your name before joining a meeting");
            return
        }
        sessionStorage.setItem("username",name)
        sessionStorage.setItem("role",JSON.stringify(roles))
        navigate(`/room/${meetingCode}`); //joining the room
    }
    function handleRoleChange(e) {
        const value = e.target.value;
        setRoles(prev=>
            prev.includes(value)? prev.filter(r=>r!==value):[...prev,value]
        );
    }

    return (
    <div className="home-parent">
        <div className="nexus-logo">
            <p>Ne&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;us</p>
            <video
            src="/NexusLogoAnim.mp4"
            autoPlay
            muted
            loop
            playsInline
            />

        </div>
        <div className="home-card">
            <p>Name</p>
            <input type="text" className="name" placeholder="Enter your name here" onChange={(e)=>setName(e.target.value)}></input>
            <p>Role</p>
            <div><input type="checkbox" className="deaf-checkbox" id="deaf-checkbox" name="deaf" value={"deaf"} onChange={handleRoleChange}></input>
            <label htmlFor="deaf-checkbox">Deaf 🎧</label></div>
            <div><input type="checkbox" className="mute-checkbox" id="mute-checkbox" name="mute" value={"mute"} onChange={handleRoleChange}></input>
            <label htmlFor="mute-checkbox">Mute 🔇</label></div>
            <div><input type="checkbox" className="hearing-checkbox" id="hearing-checkbox" name="hearing" value={"hearing"} onChange={handleRoleChange}></input>
            <label htmlFor="hearing-checkbox">Hearing 👂</label></div>
            <div><input type="checkbox" className="speaking-checkbox" id="speaking-checkbox" name="speaking" value={"speaking"} onChange={handleRoleChange}></input>
            <label htmlFor="speaking-checkbox">Speaking 👄</label></div>
    
            <button onClick={create} className="create-meeting-btn">Create Meeting</button>
      
            <div className="join-meeting-div">
                <input type="text" placeholder="Meeting Code" className="meeting-code" value={meetingCode} onChange={(e)=>setMeetingCode(e.target.value)}></input>
                <button className="join-meeting-btn" onClick={joinMeeting}>Join Meeting</button>
            </div>
        </div>
        
    </div>);
    
}

export default HomePage;