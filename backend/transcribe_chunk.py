import sys
import whisper
import tempfile
import subprocess
from pydub import AudioSegment
from pydub.utils import which
import os

AudioSegment.converter = which("ffmpeg")

model = whisper.load_model("tiny")

def transcribe_audio(data):
    raw_path=None
    wav_path=None
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as raw:
        raw.write(data)
        raw.flush()
        raw_path = raw.name

    try:
        audio = AudioSegment.from_file(raw_path, format="webm")
    
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
            audio.export(tmp_in.name, format="wav")
            wav_path = tmp_in.name

        result = model.transcribe(tmp_in.name,fp16=False)
        return result["text"]
    except Exception as e:
        return f"Error: {e}"
    finally:
        if raw_path and os.path.exists(raw_path):
            os.remove(raw_path)
        if wav_path and os.path.exists(wav_path):
            os.remove(wav_path)

if __name__ == "__main__":
    input_data = sys.stdin.buffer.read()
    text = transcribe_audio(input_data)
    print(text.strip())
