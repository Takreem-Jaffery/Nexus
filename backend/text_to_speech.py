from TTS.api import TTS
import sys
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uuid
import os
import tempfile

app = FastAPI()

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

class TTSRequest(BaseModel):
    text: str

@app.post("/synthesize")
async def synthesize(req:TTSRequest):
    text = req.text

    temp_dir = tempfile.gettempdir()
    out_path = os.path.join(temp_dir, f"{uuid.uuid4()}.wav")
    
    tts.tts_to_file(text=text, file_path=out_path)
    return FileResponse(out_path, media_type="audio/wav", filename="tts.wav")

#Functionality for TTS with Child Process
# def synthesize(text, out_path="tts_output.wav"):
#     tts.tts_to_file(text=text, file_path=out_path)

# if __name__ == "__main__":
#     try:
#         text = sys.argv[1]
#         out_path = sys.argv[2]
#         synthesize(text, out_path)
#     except Exception as e:
#         print("[PYTHON ERROR TTS]: ", str(e), file=sys.stderr)
#         exit(1)