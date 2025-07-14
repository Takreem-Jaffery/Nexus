import { useEffect } from "react";

// function useMicTranscription(socket, roomId,userId){
//     useEffect(()=>{
//         if(!socket || !roomId || !userId) return;

//         let mediaRecorder;
//         let chunkTimer;

function getSupportedMimeType(){
    const options = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    ];
    if (typeof MediaRecorder === "undefined") {
        console.error("MediaRecorder is not supported in this browser.");
        return;
    }

    return options.find(type=>MediaRecorder.isTypeSupported(type))
}

async function getMicStream() {
    try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
        console.error("Failed to get microphone stream:", err);
        return null;
    }
}
function startRecording(stream, mimeType, socket, roomId, userId) {
    const recorder = new MediaRecorder(stream, { mimeType });

    // const interval = setInterval(() => {
    //     if (recorder.state === "recording") {
    //         recorder.requestData();
    //     }
    // }, 5000);
    recorder.onerror = (e) => console.error("[MediaRecorder Error]:", e);
    recorder.onstop = () => console.warn("[MediaRecorder] Stopped recording");

    recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
            // const blob = new Blob([e.data],{type:mimeType})
            
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result;//.split(',')[1];
                socket.emit("audio-chunk", {
                    blob: base64Data,
                    roomId,
                    userId
                });
            };
            console.log("[Frontend] Emitting audio chunk");

            reader.readAsDataURL(e.data);
        }
    };

    recorder.start(5000);

    return () => {
        // clearInterval(interval);
        if (recorder.state !== "inactive") {
            recorder.stop();
        }
    };
}

function useMicTranscription(socket, roomId, userId) {
    useEffect(() => {
        if (!socket || !roomId || !userId) return;

        let cleanup = () => {};

        (async () => {
            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                console.error("No supported MIME type found");
                return
            };

            const stream = await getMicStream();
            if (!stream) return;

            cleanup = startRecording(stream, mimeType, socket, roomId, userId);
        })();

        return () => cleanup();
    }, [socket, roomId, userId]);
}
// }

export default useMicTranscription;