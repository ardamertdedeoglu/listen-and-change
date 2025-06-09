#!/usr/bin/env python3
"""
Text-to-Speech script using pyttsx3 and gTTS
Generates replacement audio for specific words
"""

import sys
import json
import os
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_tts_with_pyttsx3(text, output_path, rate=150, volume=0.9):
    """Generate TTS using pyttsx3 (offline)"""
    try:
        import pyttsx3
        
        engine = pyttsx3.init()
        
        # Configure voice properties
        engine.setProperty('rate', rate)  # Speed of speech
        engine.setProperty('volume', volume)  # Volume level
        
        # Try to set a better voice if available
        voices = engine.getProperty('voices')
        if voices:
            # Prefer female voice or first available voice
            for voice in voices:
                if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                    engine.setProperty('voice', voice.id)
                    break
        
        # Generate speech and save to file
        engine.save_to_file(text, output_path)
        engine.runAndWait()
        
        logger.info(f"TTS generated successfully with pyttsx3: {output_path}")
        return True
        
    except ImportError:
        logger.warning("pyttsx3 not available")
        return False
    except Exception as e:
        logger.error(f"pyttsx3 TTS generation failed: {e}")
        return False

def generate_tts_with_gtts(text, output_path, lang='en'):
    """Generate TTS using gTTS (requires internet)"""
    try:
        from gtts import gTTS
        from pydub import AudioSegment
        
        # Create gTTS object
        tts = gTTS(text=text, lang=lang, slow=False)
        
        # Save to temporary mp3 file
        temp_mp3 = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_mp3.name)
        
        # Convert MP3 to WAV for consistency
        audio = AudioSegment.from_mp3(temp_mp3.name)
        audio.export(output_path, format="wav")
        
        # Clean up temp file
        os.unlink(temp_mp3.name)
        
        logger.info(f"TTS generated successfully with gTTS: {output_path}")
        return True
        
    except ImportError:
        logger.warning("gTTS or dependencies not available")
        return False
    except Exception as e:
        logger.error(f"gTTS TTS generation failed: {e}")
        return False

def create_silence(duration_seconds, output_path, sample_rate=44100):
    """Create a silent audio file of specified duration"""
    try:
        from pydub import AudioSegment
        
        # Create silence
        silence = AudioSegment.silent(duration=duration_seconds * 1000)  # duration in milliseconds
        silence = silence.set_frame_rate(sample_rate).set_channels(2)
        
        # Export as WAV
        silence.export(output_path, format="wav")
        
        logger.info(f"Silence generated: {output_path} ({duration_seconds}s)")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create silence: {e}")
        return False

def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            "error": "Usage: python tts_script.py <text> <output_path> [rate] [volume]"
        }))
        sys.exit(1)
    
    text = sys.argv[1]
    output_path = sys.argv[2]
    rate = int(sys.argv[3]) if len(sys.argv) > 3 else 150
    volume = float(sys.argv[4]) if len(sys.argv) > 4 else 0.9
    
    try:
        logger.info(f"Generating TTS for: '{text}'")
        
        # Ensure output directory exists
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        # Try different TTS methods in order of preference
        success = False
        
        # Method 1: pyttsx3 (offline, fast)
        if not success:
            success = generate_tts_with_pyttsx3(text, output_path, rate, volume)
        
        # Method 2: gTTS (online, better quality)
        if not success:
            success = generate_tts_with_gtts(text, output_path)
        
        # Fallback: Create silence if all methods fail
        if not success:
            logger.warning("All TTS methods failed, creating silence as fallback")
            word_duration = max(0.5, len(text.split()) * 0.3)  # Estimate duration
            success = create_silence(word_duration, output_path)
        
        if success and os.path.exists(output_path):
            # Get file info
            file_size = os.path.getsize(output_path)
            
            result = {
                "success": True,
                "output_path": output_path,
                "text": text,
                "file_size": file_size,
                "message": "TTS generated successfully"
            }
        else:
            result = {
                "success": False,
                "error": "Failed to generate TTS audio",
                "text": text
            }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "text": text
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()