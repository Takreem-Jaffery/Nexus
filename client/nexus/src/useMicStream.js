import { useEffect } from "react";

function useMicTranscription(socket, roomId,userId){
    useEffect(()=>{
        if(!socket || !roomId || !userId) return;
        let mediaRecorder;
        let chunkTimer;

        async function startRecording() {
            const stream = await navigator.mediaDevices.getUserMedia({audio:true});
            // const supportedType = MediaRecorder.isTypeSupported("audio/ogg; codecs=opus")
            // ? "audio/ogg; codecs=opus"
            // : "audio/webm";  // fallback
            // const supportedType = MediaRecorder.isTypeSupported("audio/webm")
            // ? "audio/webm"
            // : ""; // fallback to default
            const options = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus",
            ];

            const mimeType = options.find((type) => MediaRecorder.isTypeSupported(type));

            mediaRecorder = new MediaRecorder(stream, { mimeType });

            // mediaRecorder = new MediaRecorder(stream, {mimeType:"audio/webm"});
            chunkTimer = setInterval(()=>{
                if(mediaRecorder && mediaRecorder.state ==="recording"){
                    mediaRecorder.requestData();
                }
            }, 3000)
            mediaRecorder.ondataavailable = async(e)=>{
                if(e.data.size >0){
                    const blob = new Blob([e.data], { type: mimeType});
                    const arrayBuffer = await blob.arrayBuffer();
                    const uint8 = new Uint8Array(arrayBuffer);
                    socket.emit("audio-chunk", { blob: uint8, roomId, userId });

                }
            }

            mediaRecorder.start() //send chunks every 3 seconds
            // setInterval(()=>{
            //     if(mediaRecorder && mediaRecorder.state ==="recording"){
            //         mediaRecorder.requestData();
            //     }
            // }, 3000)
        }
        startRecording();

        return()=>{
            clearInterval(chunkTimer)
            if(mediaRecorder && mediaRecorder.state !=="inactive"){
                mediaRecorder.stop()
            }
        };
    },[socket,roomId,userId])
}

export default useMicTranscription;