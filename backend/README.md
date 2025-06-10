# Enhanced Speech Recognition System

This directory contains the backend services for the Listen and Change application, with a focus on the enhanced speech recognition system.

## Recent Improvements

### Speech Recognition Enhancements

The speech recognition system has been significantly improved to provide more accurate word timestamps. The following enhancements have been implemented:

1. **Multiple Recognition Engines**:
   - Added support for OpenAI's Whisper (primary engine with excellent word timestamps)
   - Added support for Vosk (offline engine with good word timestamps)
   - No longer using Google Speech Recognition to avoid costs

2. **Enhanced Word Boundary Detection**:
   - Implemented a more sophisticated audio analysis algorithm
   - Uses multiple envelope detection methods (absolute value, Hilbert transform, energy-based)
   - Applies bandpass filtering to focus on speech frequencies
   - Uses adaptive thresholding for better peak detection

3. **Improved Word Timing Distribution**:
   - Enhanced the fallback distribution algorithm with multiple factors:
     - Character length (50% weight)
     - Syllable count (30% weight)
     - Word frequency (20% weight)
   - Accounts for natural speech patterns and pauses
   - Distributes pause time based on word complexity

4. **Better Error Handling and Fallbacks**:
   - Graceful degradation through multiple recognition engines
   - Improved error reporting and logging
   - Automatic cleanup of temporary files

## Dependencies

The enhanced speech recognition system requires the following dependencies:

```
SpeechRecognition==3.10.0
pydub==0.25.1
numpy==1.24.3
scipy==1.10.1
compromise==0.0.1
natural==6.2.0
vosk==0.3.45
openai-whisper==20231117
ffmpeg-python==0.2.0
```

## Usage

The speech recognition script can be used as follows:

```bash
python speech_recognition_script.py <audio_file>
```

The script will:
1. Convert the audio file to WAV format if needed
2. Attempt to transcribe using Whisper (if available)
3. Fall back to Vosk if Whisper is not available
4. Return a JSON object with the transcription and word timestamps

## Output Format

The script returns a JSON object with the following structure:

```json
{
  "text": "The full transcription text",
  "words": [
    {
      "word": "The",
      "startTime": 0.0,
      "endTime": 0.3,
      "confidence": 0.9,
      "source": "whisper"
    },
    ...
  ],
  "duration": 10.5,
  "source": "whisper"
}
```

## Notes

- The Vosk model will be automatically downloaded on first use
- Whisper requires more computational resources but provides the most accurate results
- The system will automatically select the best available engine based on accuracy and availability 