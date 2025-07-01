import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import "./Room.css"
import BottomBar from "./BottomBar";
import Chat from "./Chat"
import RemoteVideo from "./RemoteVideo";

const ICE_SERVERS = [
  { urls: "stun:stun.stunprotocol.org" },
  {
    urls: "turn:numb.viagenie.ca",
    credential: "muazkh",
    username: "webrtc@live.com",
  },
];

export default function Room() {
  const navigate = useNavigate();
  const { roomID } = useParams();
  const userVideo = useRef();
  const [remoteStreams, setRemoteStreams] = useState([]);

  const socketRef = useRef();
  const userStream = useRef();
  const peerConnections = useRef({}); 

  const username = sessionStorage.getItem("username");
  const userRole = JSON.parse(sessionStorage.getItem("role"))

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraOffUsers, setCameraOffUsers] = useState({})
  
  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      userVideo.current.srcObject = stream;
      userStream.current = stream;
      

      const socket = io.connect("http://localhost:8000");
      socketRef.current = socket;

      socket.on("all users", async (userList) => {
        console.log("[INFO] All existing user IDs:", userList);
        const myId = socket.id;
        for (const {id, username} of userList) {
          if (id === myId) continue; // skip yourself
          await callUser(id);
          setRemoteStreams((prev) => {
            const exists = prev.some((user) => user.id === id);
            if (!exists) {
              return [...prev, { id, stream: null, username }];
            }
            return prev.map((user) =>
              user.id === id ? { ...user, username } : user
            );
          });
        }
      });


      // socket.on("user joined", async ({id, username}) => {
      //   // if (!id) return;
      //   console.log("[INFO] New user joined:", id);
      //   // await callUser(id);
      //   if (!remoteStreams.find((user) => user.id === id)) {
      //     setRemoteStreams((prev) => [...prev, { id, stream: null, username }]);
      //   }
      //   console.log(remoteStreams)
        
      // });
      socket.on("user joined", async ({ id, username }) => {
        setRemoteStreams((prev) => {
          const exists = prev.some((user) => user.id === id);
          if (!exists) {
            return [...prev, { id, stream: null, username }];
          }
          return prev.map((user) =>
            user.id === id ? { ...user, username } : user
          );
        });
        if (!peerConnections.current[id]) {
          await callUser(id);
        }
      });
      socket.on("offer", async ({ caller, sdp }) => {
        console.log("[INFO][OFFER LISTENER ACTIVE]", caller);
        await handleReceiveCall(caller, sdp);
      });

   
      socket.on("answer", async ({ caller, sdp }) => {
        const peerConnection = peerConnections.current[caller];
        if (!peerConnection) {
            console.error("[ERR] No peerConnection found for:", caller);
            return;
        }
        if (peerConnection.signalingState !== "have-local-offer") {
            console.warn("[WARN] Not in have-local-offer state, ignoring answer");
            return;
        }

        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("ice-candidate", async ({ caller, candidate }) => {
        const peerConnection = peerConnections.current[caller];
        if (!peerConnection) return;

        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("user left",(id)=>{
        console.log("[INFO] User left:", id);

        const peerConnection = peerConnections.current[id];
        if (peerConnection) {
          peerConnection.close();
          delete peerConnections.current[id];
        }

        setRemoteStreams((prev) => prev.filter((user) => user.id !== id));
      })

      socket.on("connect", () => {
        console.log("[INFO] Connected as:", socket.id);
        socket.emit("join room", {roomID,username});
      });

      socket.on("camera-toggle",({userId,isCameraOff})=>{
        setCameraOffUsers((prev)=>({
          ...prev,
          [userId]: isCameraOff
        }));
      })

      socket.on("initial-camera-states", (states)=>{
        setCameraOffUsers(states)
      })
    }

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      for (const pc of Object.values(peerConnections.current)) {
        pc.close();
      }
    };
  }, [roomID]);

  async function callUser(userId) {
    if (peerConnections.current[userId]) {
        console.log("[INFO] Peer already exists for:", userId);
        return;
    }
    const peerConnection = createPeerConnection(userId);
    userStream.current.getTracks().forEach((track) =>
      peerConnection.addTrack(track, userStream.current)
    );
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socketRef.current.emit("offer", {
      target: userId,
      caller: socketRef.current.id,
      sdp: peerConnection.localDescription,
    });
  }

  function createPeerConnection(userId) {
    const peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnections.current[userId] = peerConnection;

    
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0]
      if(!stream) return
      // setRemoteStreams((prev) => {
      //   const exists = prev.some((user)=>user.id===userId);
        
      //   if(!exists){
      //     return [...prev, { id: userId, stream, username: "Unknown" }];
      //   }
      //   return prev.map((user) =>
      //     user.id === userId ? { ...user, stream } : user
      //   )
      // });
      // console.log(`[ontrack] Received stream from ${userId}`, stream);
      // setRemoteStreams((prev) =>
      //   prev.map((user) =>
      //     user.id === userId ? { ...user, stream } : user
      //   )
      // );
      setRemoteStreams((prev) => {
        const exists = prev.some((user) => user.id === userId);
        if (!exists) {
          return [...prev, { id: userId, stream, username: "Unknown" }];
        }
        return prev.map((user) =>
          user.id === userId ? { ...user, stream } : user
        );
      });
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          target: userId,
          caller: socketRef.current.id,
          candidate: event.candidate,
        });
      }
    };
    return peerConnection;
  }

  async function handleReceiveCall(caller, sdp) {
    const peerConnection = createPeerConnection(caller);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
    userStream.current.getTracks().forEach((track) =>
      peerConnection.addTrack(track, userStream.current)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socketRef.current.emit("answer", {
      target: caller,
      caller: socketRef.current.id,
      sdp: peerConnection.localDescription,
    });
  }

  function endCall() {
    //stop camera and mic
    if (userStream.current) {
      userStream.current.getTracks().forEach(track => track.stop());
    }

    //close all peer connections
    for (const id in peerConnections.current) {
      peerConnections.current[id].close();
      delete peerConnections.current[id];
    }

    //disconnect the socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    navigate('/');
  }

  function toggleMute(){
    if(userStream.current){
      const audioTrack = userStream.current.getAudioTracks()[0];
      if(audioTrack){
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }
  function toggleCamera(){
    if(userStream.current){
      const videoTrack = userStream.current.getVideoTracks()[0]
      if(videoTrack){
        videoTrack.enabled = !videoTrack.enabled;
        const newCameraState = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled)

        socketRef.current.emit("camera-toggle",{
          userId: socketRef.current.id,
          isCameraOff: newCameraState
        });
      }
    }
  }

  return (<div className="outer-div">
    <div className="video-area">
        <div className="room-grid">
          <div className="video-wrapper">
            <div className="video-container">
              <video 
                autoPlay 
                playsInline 
                muted 
                ref={userVideo} 
                className={isCameraOff?"camera-off":undefined} />
              {isMuted && (
                <div className="mute-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 11c0 1.19-.34 2.3-.9 3.28l-1.23-1.23c.27-.62.43-1.31.43-2.05zm-4 .16L9 5.18V5a3 3 0 0 1 3-3a3 3 0 0 1 3 3zM4.27 3L21 19.73L19.73 21l-4.19-4.19c-.77.46-1.63.77-2.54.91V21h-2v-3.28c-3.28-.49-6-3.31-6-6.72h1.7c0 3 2.54 5.1 5.3 5.1c.81 0 1.6-.19 2.31-.52l-1.66-1.66L12 14a3 3 0 0 1-3-3v-.72L3 4.27z"/></svg>
                </div>
              )}
              {isCameraOff&&(
                <div className="camera-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3.41 1.86L2 3.27L4.73 6H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12c.21 0 .39-.08.55-.18L19.73 21l1.41-1.41l-8.86-8.86zM5 16V8h1.73l8 8zm10-8v2.61l6 6V6.5l-4 4V7a1 1 0 0 0-1-1h-5.61l2 2z"/></svg>
                </div>
                
              )}
              <div className="name-overlay">
                <p>{!username || username==="undefined"? "Anonymous": username}</p>    
              </div>
            </div>
          </div>
          {remoteStreams.map((user, index) => 
            <RemoteVideo 
              key={user.id}
              stream={user.stream}
              isCameraOff={!!cameraOffUsers[user.id]}
              username = {user.username}/>
            // {
              
            //   const cameraOff = !!cameraOffUsers[user.id];
            //   console.log(user.id, "cameraOff:", cameraOff);
              
            // return (
            // <div className="video-wrapper" key={user.id||index}>
            //   <div className="video-container">
            //     {!cameraOff?(
            //       <video
            //       autoPlay
            //       playsInline
            //       ref={(el) => {
            //         if (el) {
            //           el.srcObject = user.stream ?? null;
            //         }
            //       }}
            //     />
            //   ):(
            //       <div className="video-placeholder">
            //         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#000" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"/></svg>
            //       </div>
            //     )}
            //     <div className="name-overlay">
            //       <p>{!user.username || user.username === "undefined" ? "Anonymous" : user.username}</p>
            //     </div>
            //   </div>
            // </div>
            // )
            // })}
          )}
          
        </div>
        <div className="bottom-area"><BottomBar 
          onEndCall={endCall} 
          onToggleMute={toggleMute} 
          isMuted={isMuted}
          onToggleCamera={toggleCamera}
          isCameraOff={isCameraOff}/></div>
    </div>
    <div className="chat-area">
      <Chat socket={socketRef.current} roomId={roomID} username={username}/>
    </div>
  </div>
  );
}
