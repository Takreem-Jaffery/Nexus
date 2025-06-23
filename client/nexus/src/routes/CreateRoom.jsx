import React from "react";
import { useNavigate } from "react-router-dom";
import {v1 as uuid} from "uuid";

const CreateRoom = ()=>{
    const navigate = useNavigate()
    function create(){
        const id = uuid(); //create an id
        navigate(`/room/${id}`); //go to that room
    }

    return (
        <button onClick={create}>Create Room</button>
    );
    
}

export default CreateRoom;