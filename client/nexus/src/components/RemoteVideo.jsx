import { useEffect, useRef } from "react";

export default function RemoteVideo({ stream, isCameraOff, username, isActive }) {
  const videoRef = useRef();

  // useEffect(() => {
  //   if (videoRef.current && stream) {
  //     videoRef.current.srcObject = stream;
  //     console.log(`[RemoteVideo] Rendered with stream`, stream)
  //   }
  // }, [stream]);
  useEffect(() => {
    if (videoRef.current) {
      if (stream && !isCameraOff) {
        videoRef.current.srcObject = stream;
      } else {
        videoRef.current.srcObject = null; // Remove frozen video
      }
    }
  }, [stream, isCameraOff]);


  return (
    <div className={`video-wrapper ${isActive ? "active-speaker":""}`}>
      <div className="video-container">
        {!isCameraOff ? (
            
          <video autoPlay playsInline ref={videoRef} className="remote-video"/>
        ) : (
          <div className="video-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#000" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"/>
            </svg>
          </div>
        )}
        <div className="name-overlay">
          <p>{!username || username === "undefined" ? "Anonymous" : username}</p>
        </div>
      </div>
    </div>
  );
}
