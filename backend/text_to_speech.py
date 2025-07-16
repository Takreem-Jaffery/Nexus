from TTS.api import TTS
import sys

tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False, gpu=False)

def synthesize(text, out_path="tts_output.wav"):
    tts.tts_to_file(text=text, file_path=out_path)

if __name__ == "__main__":
    try:
        text = sys.argv[1]
        out_path = sys.argv[2]
        synthesize(text, out_path)
    except Exception as e:
        print("[PYTHON ERROR TTS]: ", str(e), file=sys.stderr)
        exit(1)