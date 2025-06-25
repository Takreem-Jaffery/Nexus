import React from "react";
import { useNavigate } from "react-router-dom";
import {v1 as uuid} from "uuid";
import "./HomePage.css"

const HomePage = ()=>{
    const navigate = useNavigate()
    function create(){
        const id = uuid(); //create an id
        navigate(`/room/${id}`); //go to that room
    }

    return (
        <div className="home-card">
            <p>Name</p>
            <input type="text" className="name" placeholder="Enter your name here"></input>
            <p>Role</p>
            <div><input type="checkbox" className="deaf-checkbox" id="deaf-checkbox" name="deaf" value={"deaf"}></input>
            <label htmlFor="deaf-checkbox">Deaf 🎧</label></div>
            <div><input type="checkbox" className="mute-checkbox" id="mute-checkbox" name="mute" value={"mute"}></input>
            <label htmlFor="mute-checkbox">Mute 🔇</label></div>
            <div><input type="checkbox" className="hearing-checkbox" id="hearing-checkbox" name="hearing" value={"hearing"}></input>
            <label htmlFor="hearing-checkbox">Hearing 👂</label></div>
            <div><input type="checkbox" className="speaking-checkbox" id="speaking-checkbox" name="speaking" value={"speaking"}></input>
            <label htmlFor="speaking-checkbox">Speaking 👄</label></div>
    
            <button onClick={create} className="create-meeting-btn">Create Meeting</button>
      
            <div className="join-meeting-div">
                <input type="text" placeholder="Meeting Code" className="meeting-code"></input>
                <button className="join-meeting-btn">Join Meeting</button>
            </div>
        </div>
        );
    
}

export default HomePage;