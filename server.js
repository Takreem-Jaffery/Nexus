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

io.on("connection", (socket) => {
  console.log(`[INFO] ${socket.id} connected`);

  socket.on("join room", (roomID) => {
    if (!rooms[roomID]) rooms[roomID] = [];
    rooms[roomID].push(socket.id);

    socketToRoom[socket.id] = roomID;
    const otherUsers = rooms[roomID].filter((id) => id !== socket.id);
    socket.emit("all users", otherUsers);

    setTimeout(() => { //delaying it slightly
        socket.to(roomID).emit("user joined", socket.id);
    }, 100);
    // socket.to(roomID).emit("user joined", socket.id);
    socket.join(roomID);
    userToRoomMap[socket.id] =roomID;
    
    socket.emit("initial-camera-states", cameraStates);
    otherUsers.forEach((id) => {
      io.to(id).emit("user joined", socket.id)
    });
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
  socket.on("camera-toggle", ({ userId, isCameraOff }) => {
    const roomID = userToRoomMap[socket.id];
    
    if(roomID)
      cameraStates[userId]=isCameraOff;
      socket.to(roomID).emit("camera-toggle", { userId, isCameraOff });
  });


  socket.on("disconnect",()=>{
    const roomID = socketToRoom[socket.id];
    if (!roomID) return;

    //let room = users[roomID] //list of all socket ids connected to that room
    if(rooms[roomID]){
      rooms[roomID] = rooms[roomID].filter(id=>id!==socket.id)
      //users[roomID] = room //only current users minus the one that left
      socket.to(roomID).emit("user left",socket.id);
    }
    delete socketToRoom[socket.id]
    delete userToRoomMap[socket.id]
    delete cameraStates[socket.id]
  })

  
});



server.listen(8000, () => {
  console.log("[INFO] Server running on http://localhost:8000");
});
