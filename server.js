// const express = require("express");
// const http = require("http")
// const app = express();
// const server = http.createServer(app);
// const { Server } = require("socket.io")
// // const io = socket(server);
// const cors = require("cors")

// const rooms = {};

// app.use(cors({origin:"http://localhost:5173"}))

// const io = new Server(server,{
//     cors:{
//         origin: "http://localhost:5173",
//         methods: ["GET","POST"]
//     }
// });

// io.on("connection",socket=>{
//     console.log(`[Server] New connection: ${socket.id}`);
//     socket.on("connect", () => {
//         console.log("[INFO] Socket connected:", socket.id);
//     });

//     socket.on("join room",roomID=>{
//         console.log(`[Server] ${socket.id} requested to join room ${roomID}`);
        
//         if(!rooms[roomID]){
//             rooms[roomID] =[]
//         }
//         rooms[roomID].push(socket.id)
        
//         if(rooms[roomID].length >1){
//             const otherUser = rooms[roomID].find(id=>id!==socket.id);
//             if(otherUser){
//                 console.log(`[Server] Sending "other user" to ${socket.id}, "user joined" to ${otherUser}`);
//                 socket.emit("other user",otherUser);
//                 socket.to(otherUser).emit("user joined",socket.id);
//             }
//         }else{
//             console.log(`[Server] ${socket.id} joined room ${roomID}. First user in room.`);
//         }
//     })

//     socket.on("offer",payload=>{ //payload includes who you are, your user id
//         io.to(payload.target).emit("offer",payload);
//     })

//     socket.on("answer",payload=>{
//         io.to(payload.target).emit("answer",payload);
//     })

//     socket.on("ice-candidate",incoming=>{ //two pairs agree on a proper candidate
//         io.to(incoming.target).emit("ice-candidate",incoming.candidate);
//     })
// })

// server.listen(8000,()=>{
//     console.log("Server is running on port 8000");
// });

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

io.on("connection", (socket) => {
  console.log(`[INFO] ${socket.id} connected`);

  socket.on("join room", (roomID) => {
    if (!rooms[roomID]) rooms[roomID] = [];
    rooms[roomID].push(socket.id);

    const otherUsers = rooms[roomID].filter((id) => id !== socket.id);
    socket.emit("all users", otherUsers);

    setTimeout(() => { //delaying it slightly
        socket.to(roomID).emit("user joined", socket.id);
    }, 100);
    // socket.to(roomID).emit("user joined", socket.id);
    socket.join(roomID);
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
});

server.listen(8000, () => {
  console.log("[INFO] Server running on http://localhost:8000");
});
