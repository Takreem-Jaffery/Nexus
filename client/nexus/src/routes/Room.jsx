import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import "./Room.css"

const ICE_SERVERS = [
  { urls: "stun:stun.stunprotocol.org" },
  {
    urls: "turn:numb.viagenie.ca",
    credential: "muazkh",
    username: "webrtc@live.com",
  },
];

export default function Room() {
  const { roomID } = useParams();
  const userVideo = useRef();
  const [remoteStreams, setRemoteStreams] = useState([]);

  const socketRef = useRef();
  const userStream = useRef();
  const peerConnections = useRef({}); 

  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      userVideo.current.srcObject = stream;
      userStream.current = stream;


      const socket = io.connect("http://localhost:8000");
      socketRef.current = socket;

      socket.on("all users", async (userIDs) => {
        console.log("[INFO] All existing user IDs:", userIDs);
        for (const id of userIDs) {
          await callUser(id);
        }
      });


      socket.on("user joined", async (userId) => {
        console.log("[INFO] New user joined:", userId);
        await callUser(userId);
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

      socket.on("connect", () => {
        console.log("[INFO] Connected as:", socket.id);
        socket.emit("join room", roomID);
      });
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
      setRemoteStreams((prev) => {
        if (!prev.find((s) => s.id === userId)) {
          return [...prev, { id: userId, stream: event.streams[0] }];
        }
        return prev;
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

  return (
    <div className="room-grid">
      <video autoPlay playsInline muted ref={userVideo} className="w-full rounded" />
      {remoteStreams.map((user) => (
        <video
          key={user.id}
          autoPlay
          playsInline
          ref={(element) => {
            if (element) element.srcObject = user.stream;
          }}
        />
      ))}
    </div>
  );
}
