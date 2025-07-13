# import sys
# import whisper
# import tempfile
# import subprocess
# from pydub import AudioSegment
# from pydub.utils import which
# import os

# AudioSegment.converter = which("ffmpeg")

# model = whisper.load_model("tiny")

# def transcribe_audio(data):
#     raw_path=None
#     wav_path=None
#     with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as raw:
#         raw.write(data)
#         raw.flush()
#         raw_path = raw.name

#     try:
#         print("DEBUG: raw_path =", raw_path)
#         print("DEBUG: size =", os.path.getsize(raw_path))

#         with open(raw_path, "rb") as f:
#             head = f.read(4)
#             if head != b"\x1a\x45\xdf\xa3":  # EBML magic header
#                 return "Invalid WebM file: missing EBML header"
        
#         #convert webm to wav using pydub
#         audio = AudioSegment.from_file(raw_path, format="webm")
    
#         with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
#             audio.export(tmp_in.name, format="wav")
#             wav_path = tmp_in.name

#         result = model.transcribe(tmp_in.name,fp16=False)
#         return result["text"]
    
#     except Exception as e:
#         error_path = raw_path + ".error.webm"
#         os.rename(raw_path, error_path)
#         print(f"Saved broken file to: {error_path}")
#         return f"Error: {e}"
#         # return f"Error: {e}"

#     finally:
#         if raw_path and os.path.exists(raw_path):
#             os.remove(raw_path)
#         if wav_path and os.path.exists(wav_path):
#             os.remove(wav_path)

# if __name__ == "__main__":
#     input_data = sys.stdin.buffer.read()
#     text = transcribe_audio(input_data)
#     print(text.strip())
# transcribe_chunk.py
import whisper
import sys
import os
import tempfile
from pydub import AudioSegment
from pydub.utils import which

AudioSegment.converter = which("ffmpeg")

model = whisper.load_model("tiny")  # or tiny/medium as needed

def transcribe(file_path):
    try:
        audio = AudioSegment.from_file(file_path, format="webm")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_wav:
            wav_path = tmp_wav.name
            audio.export(wav_path, format="wav")
        
        result = model.transcribe(wav_path, fp16=False)
        print(result["text"])

    except Exception as e:
        print(f"[ERROR] {e}")

    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
            
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe_chunk.py <input_file>")
        sys.exit(1)
    transcribe(sys.argv[1])