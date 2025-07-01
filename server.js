const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

const socketToRoom = {};
const userToRoomMap = {}
const cameraStates = {};

const users = {}

io.on("connection", (socket) => {
  console.log(`[INFO] ${socket.id} connected`);

  socket.on("join room", ({roomID,username}) => {
    console.log(`[SERVER] ${socket.id} joined room ${roomID} as ${username}`);
    users[socket.id] = {username, roomID}
    if (!rooms[roomID]) rooms[roomID] = [];
    rooms[roomID].push(socket.id);

    socketToRoom[socket.id] = roomID;
    // const otherUsers = rooms[roomID].filter((id) => id !== socket.id);
    // socket.emit("all users", otherUsers);

    socket.join(roomID);

    const userList = Object.entries(users)
    .filter(([_, user]) => user.roomID === roomID)
    .map(([id, user]) => ({ id, username: user.username }));

    socket.emit("all users", userList);

    setTimeout(() => { //delaying it slightly
        socket.to(roomID).emit("user joined", {id: socket.id, username});
    }, 100);
    // socket.to(roomID).emit("user joined", socket.id);
    
    userToRoomMap[socket.id] =roomID;
    
    socket.emit("initial-camera-states", cameraStates);
    // userList.forEach((id) => {
    //   io.to(id).emit("user joined", socket.id)
    // });
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", {
      sdp: payload.sdp,
      caller: payload.caller,
    });
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", {
      sdp: payload.sdp,
      caller: payload.caller,
    });
  });

  socket.on("ice-candidate", (incoming) => {
    io.to(incoming.target).emit("ice-candidate", {
      candidate: incoming.candidate,
      caller: socket.id,
    });
  });
  socket.on("camera-toggle", ({ isCameraOff }) => {
    const roomID = userToRoomMap[socket.id];
    
    if(roomID)
      cameraStates[socket.id]=isCameraOff;
      socket.to(roomID).emit("camera-toggle", { userId:socket.id, isCameraOff });
  });

  //MESSAGING
  socket.on("send-message",({roomId,message,sender})=>{
    socket.to(roomId).emit("receive-message",{ message, sender })
  })

  socket.on("disconnect",()=>{
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    //let room = users[roomID] //list of all socket ids connected to that room
    if(rooms[roomID]){
      rooms[roomID] = rooms[roomID].filter(id=>id!==socket.id)
      //users[roomID] = room //only current users minus the one that left
      socket.to(roomID).emit("user left",socket.id);
    }
    const user = users[socket.id]
    if(user){
      delete users[socket.id]
    }
    delete socketToRoom[socket.id]
    delete userToRoomMap[socket.id]
    delete cameraStates[socket.id]
  })

  
});



server.listen(8000, () => {
  console.log("[INFO] Server running on http://localhost:8000");
});
