"""
Audio processing utilities for LectureWeave backend.
Based on your existing audio processing code.
"""
import shutil
import os
import subprocess
import json
from pathlib import Path

def _ffmpeg_cmd():
    """Return ffmpeg command path, honoring environment variables if set."""
    for key in ("FFMPEG_BIN", "FFMPEG_PATH", "FFMPEG_EXE"):
        val = os.environ.get(key)
        if val:
            return val
    return "ffmpeg"

def _ffmpeg_available():
    try:
        cmd = _ffmpeg_cmd()
        subprocess.run([cmd, "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        return False

def denoise_audio(input_path: str, output_path: str):
    """
    Ensure a clean 16kHz mono WAV at output_path.
    If ffmpeg is available, transcode with: -ac 1 -ar 16000.
    Otherwise, fallback to simple copy.
    """
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    
    if _ffmpeg_available():
        try:
            cmd_ffmpeg = _ffmpeg_cmd()
            cmd = [
                cmd_ffmpeg, "-y",
                "-i", input_path,
                "-ac", "1",
                "-ar", "16000",
                output_path
            ]
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return {'output_path': output_path, 'method': 'ffmpeg'}
        except Exception as e:
            # fallback to copy on error
            shutil.copyfile(input_path, output_path)
            return {'output_path': output_path, 'method': 'copy', 'error': str(e)}
    else:
        shutil.copyfile(input_path, output_path)
        return {'output_path': output_path, 'method': 'copy'}
