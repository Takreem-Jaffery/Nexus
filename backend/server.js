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

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}


const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));

const fs = require("fs")
const path = require("path")

const upload = multer({dest: "uploads/"});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"], 
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

}

function convertWebmToWav(webmPath, wavPath) {

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

async function generateTTS(text, outPath){
  console.log("🔈 Sending TTS request with text:", text);
  try{
    const response = await axios.post("https://nexus-video-call.fly.dev/tts",{text},{
      responseType:"stream"
    })

    const writer = fs.createWriteStream(outPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject)=>{
      writer.on("finish",resolve);
      writer.on("error", reject);
    });

  } catch(err){
    console.error("[TTS ERROR] Failed HTTP Request: ", err)
    throw err;
  }
  //Functionality for child process
  // return new Promise((resolve, reject)=>{
  //   const py = spawn("python", ["text_to_speech.py", text, outPath]);

  //   let stderr = "";
  //   py.stderr.on("data", (data) => {
  //     stderr += data.toString();
  //   });

  //   py.on("close", (code) => {
  //     if (code !== 0) {
  //       reject(`[TTS ERROR] Python exited with code ${code}\n${stderr}`);
  //     } else {
  //       resolve();
  //     }
  //   });
  // })
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

  });

  //Text to speech
  socket.on("tts-message",async({text,roomId,userId})=>{
    try{
      const filename = `${uuidv4()}.wav`;
      const outputPath = path.join(os.tmpdir(), filename);

      await generateTTS(text, outputPath)

      const audioBuffer = fs.readFileSync(outputPath);
      const base64Audio = audioBuffer.toString("base64");

      //emit audio
      io.to(roomId).emit("tts-play", {
        userId,
        audio: `data:audio/wav;base64,${base64Audio}`
      });

      //emit caption
      io.to(roomId).emit("tts-caption",{
        userId:socket.id,
        username: users[socket.id]?.username || "Anonymous",
        text
      })

      fs.unlinkSync(outputPath)
    } catch(err){
      console.error("[TTS ERROR] ", err);
    }
  })
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

const PORT = process.env.PORT || 8000;

server.listen(PORT, '0.0.0.0', () => {
  console.log("[INFO] Server running on ", PORT);
});
