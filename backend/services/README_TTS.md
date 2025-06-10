# Text-to-Speech Service

This service provides text-to-speech functionality using pyttsx3, a free and open-source library.

## Features

- **Offline TTS**: Uses pyttsx3 for fast, offline text-to-speech generation
- **Fallback Mechanism**: Creates silence if TTS fails

## Dependencies

- pyttsx3: For offline TTS
- pydub: For audio processing

## Installation

Make sure you have the required dependencies installed:

```bash
pip install -r requirements.txt
```

## Usage

The TTS script can be used as a standalone command-line tool:

```bash
python tts_script.py "Text to convert to speech" output.wav [rate] [volume]
```

Parameters:
- `text`: The text to convert to speech
- `output_path`: Path to save the generated audio file
- `rate` (optional): Speech rate (default: 150)
- `volume` (optional): Volume level (default: 0.9)

## How It Works

The script uses pyttsx3 for text-to-speech generation:

1. **pyttsx3**: Fast, offline TTS using system voices
2. **Silence**: Fallback if TTS fails

## Notes

- pyttsx3 uses the system's installed voices
- The script returns JSON output with success/error information 