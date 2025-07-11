import { useEffect } from "react";

function useMicTranscription(socket, roomId,userId){
    useEffect(()=>{
        if(!socket || !roomId || !userId) return;
        let mediaRecorder;

        async function startRecording() {
            const stream = await navigator.mediaDevices.getUserMedia({audio:true});
            const supportedType = MediaRecorder.isTypeSupported("audio/ogg; codecs=opus")
            ? "audio/ogg; codecs=opus"
            : "audio/webm";  // fallback

            mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });
            // mediaRecorder = new MediaRecorder(stream, {mimeType:"audio/wav"});

            // mediaRecorder.ondataavailable = async(e)=>{
            //     if(e.data.size >0){
            //         const arrayBuffer = await e.data.arrayBuffer()
            //         socket.emit("audio-chunk",{
            //             blob: new Uint8Array(arrayBuffer),
            //             roomId,
            //             userId,
            //         })
            //     }
            // }
            mediaRecorder.ondataavailable = async (event) => {
                const blob = new Blob([event.data], { type: "audio/webm" });
                const formData = new FormData();
                formData.append("file", blob, "recording.webm");

                const response = await fetch("http://localhost:8000/transcribe", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                console.log(result);
                };

            mediaRecorder.start(3000) //send chunks every 3 seconds
        }
        startRecording();

        return()=>{
            if(mediaRecorder && mediaRecorder.state !=="inactive"){
                mediaRecorder.stop()
            }
        };
    },[socket,roomId,userId])
}

export default useMicTranscription;