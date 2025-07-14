const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const {spawn} = require("child_process")
const multer = require("multer")
const axios = require("axios")
const formData = require("form-data")
const { v4: uuidv4 } = require("uuid");
const os = require("os");

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

const fs = require("fs")
const path = require("path")

const upload = multer({dest: "uploads/"});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

const socketToRoom = {};
const userToRoomMap = {}
const cameraStates = {};

const users = {}

async function saveBase64ToWebm(base64Data, outputPath) {
  // return new Promise((resolve, reject) => {
  // const matches = base64Data.match(/^data:audio\/webm(;codecs=opus)?;base64,(.+)$/);

  // const base64String = matches ? matches[2] : base64Data;
  const matches = base64Data.match(/^data:audio\/webm(?:;codecs=opus)?;base64,(.+)$/);
  if(!matches || matches.length < 2){
    throw new Error("Invalid data URL format")
  }
  const base64String = matches[1];
  const buffer = Buffer.from(base64String, "base64");
  return fs.promises.writeFile(outputPath, buffer);

  // await new Promise((res)=>setTimeout(res,200));

  // fs.writeFile(outputPath, buffer, (err) => {
  //   if (err) reject(err);
  //   else resolve();
  // });
  // });
}

function convertWebmToWav(webmPath, wavPath) {
  // fs.stat(webmPath, (err, stats) => {
  //   if (err || stats.size === 0) {
  //     console.warn("[WARN] Invalid or empty .webm chunk");
  //   } else {
  //     console.log(`[INFO] Temp .webm size: ${stats.size} bytes`);
  //   }
  // });
  // return new Promise((resolve, reject) => {
  //   const ffmpeg = require("fluent-ffmpeg");
  //   ffmpeg(webmPath)
  //     .inputOptions("-f", "webm")
  //     .audioChannels(1)
  //     .audioFrequency(16000)
  //     .format("wav")
  //     .on("end", () => resolve())
  //     .on("error", (err) => reject(err))
  //     .save(wavPath);
  // });
  return new Promise((resolve, reject) => {
    const ffmpeg = require("fluent-ffmpeg");
    ffmpeg(webmPath)
      .inputFormat("webm") // <-- explicitly declare format
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")
      .on("start", cmd => console.log(""/*[FFMPEG CMD]", cmd*/))
      .on("stderr", (line) => console.log(""/*"[FFMPEG STDERR]", line*/))
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(wavPath);
  });
}

function runWhisper(wavPath) {
  return new Promise((resolve, reject) => {
    const { spawn } = require("child_process");
    const py = spawn("python", ["transcribe_chunk.py", wavPath]);

    let result = "";
    let errorOutput = "";

    py.stdout.on("data", (chunk) => {
      result += chunk.toString();
    });

    py.stderr.on("data", (err) => {
      errorOutput += err.toString();
      console.error("[PYTHON ERROR]:", err.toString());
    });

    py.on("close", (code) => {
      if(code !==0){
        reject(`[ERROR] Python exited with code ${code}`)
      }else if(!result.trim()){
        reject("[ERROR] Transcription returned empty result")
      } else{
        resolve(result.trim())
      }
      // resolve(result.trim());
    });
  });
}

function cleanupFiles(...paths) {
  const fs = require("fs");
  paths.forEach((path) => fs.existsSync(path) && fs.unlinkSync(path));
}

io.on("connection", (socket) => {
  console.log(`[INFO] ${socket.id} connected`);

  //transcription
  socket.on("audio-chunk", async ({blob, roomId, userId})=>{
     console.log(`[Server] Received chunk from ${userId}`);
    const tempId = uuidv4();
    const webmPath = path.join(os.tmpdir(), `${tempId}.webm`);
    const wavPath = path.join(os.tmpdir(), `${tempId}.wav`);

    try {
      await saveBase64ToWebm(blob, webmPath);
      console.log("[INFO] Saved webm chunk:", webmPath);
      const buffer = await fs.promises.readFile(webmPath);
      if (!buffer.slice(0, 4).equals(Buffer.from([0x1A, 0x45, 0xDF, 0xA3]))) {
        throw new Error("[ERROR] Invalid .webm file header – skipping chunk");
      }
      const stats = await fs.promises.stat(webmPath);
      console.log("[DEBUG] .webm file size:", stats.size);

      if (stats.size === 0) {
        throw new Error("[ERROR] Empty .webm file");
      }

      await convertWebmToWav(webmPath, wavPath);
      console.log("[INFO] Converted to wav:", wavPath);

      const transcription = await runWhisper(wavPath);
      console.log(`[TRANSCRIBED] ${userId}: ${transcription}`);

      io.to(roomId).emit("transcription", { userId, transcript: transcription });
    } catch (err) {
      console.error("[ERROR] Transcription pipeline failed:", err);
    } finally {
      cleanupFiles(webmPath, wavPath);
    }
    // if (!blob || blob.length ===0){
    //   console.warn(`[WARN] Received empty blob from ${userId}`)
    //   return;
    // }
    // const ffmpeg = require("fluent-ffmpeg");

    // const tempFilename = `${uuidv4()}.webm`;
    // const tempFilePath = path.join(os.tmpdir(), tempFilename);

    // const buffer = Buffer.from(blob, "base64");

    // fs.writeFile(tempFilePath, buffer, async (err) => {
    //   if (err) {
    //     console.error("[ERROR] Failed to write blob to temp file:", err);
    //     return;
    //   }
    //   fs.stat(tempFilePath, (err, stats) => {
    //     if (err) {
    //       console.error("[ERROR] Failed to stat file:", err);
    //     } else {
    //       console.log(`[INFO] Temp .webm size: ${stats.size} bytes`);
    //       if (stats.size === 0) {
    //         console.warn("[WARN] .webm file is empty – invalid recording or blob");
    //       }
    //     }
    //   });

    //   const wavPath = tempFilePath.replace(".webm", ".wav");

    //   ffmpeg(tempFilePath)
    //   .inputOptions("-f","webm")
    //     .audioChannels(1)
    //     .audioFrequency(16000)
    //     .format("wav")
    //     .on("end", () => {

    //     const py = spawn("python", ["transcribe_chunk.py", tempFilePath]);

    //     let result = "";
    //     py.stdout.on("data", (chunk) => {
    //       result += chunk.toString();
    //     });

    //     py.stderr.on("data", (err) => {
    //       console.error("[PYTHON ERROR]:", err.toString());
    //     });

    //     py.on("close", (code) => {
    //       fs.unlink(tempFilePath, () => {}); // clean up
    //       fs.unlink(wavPath, () => {});
    //       if (result.trim()) {
    //         console.log(`[TRANSCRIBED] ${userId}: ${result.trim()}`);
    //         io.to(roomId).emit("transcription", { userId, transcript: result.trim() });
    //       } else {
    //         console.warn(`[WARN] No transcription output from Whisper (exit ${code})`);
    //       }
    //     });
    //   }).on("error",(err)=>console.error("FFMPEG error: ",err))
    //     .save(wavPath)
    // });

  });

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
