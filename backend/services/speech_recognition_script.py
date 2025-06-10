#!/usr/bin/env python3
"""
Enhanced speech-to-text script using multiple recognition engines
Supports accurate word timestamps and multiple audio formats
"""

import sys
import json
from pydub import AudioSegment
import tempfile
import os
import logging
import numpy as np
from scipy.io import wavfile
from scipy.signal import find_peaks, butter, filtfilt
import re
import time
import subprocess
import shutil
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def convert_to_wav(input_file):
    """Convert audio file to WAV format for speech recognition"""
    try:
        logger.info(f"Converting {input_file} to WAV format...")
        
        # Detect file format and convert
        file_extension = os.path.splitext(input_file)[1].lower()
        
        if file_extension == '.mp3':
            audio = AudioSegment.from_mp3(input_file)
        elif file_extension == '.m4a':
            audio = AudioSegment.from_file(input_file, "m4a")
        elif file_extension == '.mp4':
            audio = AudioSegment.from_file(input_file, "mp4")
        elif file_extension == '.ogg':
            audio = AudioSegment.from_ogg(input_file)
        elif file_extension == '.wav':
            audio = AudioSegment.from_wav(input_file)
        else:
            # Try to auto-detect format
            audio = AudioSegment.from_file(input_file)
        
        # Convert to mono and set sample rate for better recognition
        audio = audio.set_channels(1).set_frame_rate(16000)
        
        # Create temporary WAV file
        temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        audio.export(temp_wav.name, format="wav")
        
        logger.info(f"Successfully converted to WAV: {temp_wav.name}")
        return temp_wav.name
        
    except Exception as e:
        logger.error(f"Error converting audio file: {str(e)}")
        raise

def detect_word_boundaries_enhanced(wav_file):
    """
    Enhanced word boundary detection using advanced audio analysis
    Combines multiple techniques for better accuracy
    """
    try:
        logger.info("Performing enhanced word boundary detection...")
        
        # Read the WAV file
        sample_rate, audio_data = wavfile.read(wav_file)
        
        # Convert to mono if stereo
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)
        
        # Apply bandpass filter to focus on speech frequencies (300-3000 Hz)
        nyquist = 0.5 * sample_rate
        low = 300 / nyquist
        high = 3000 / nyquist
        b, a = butter(4, [low, high], btype='band')
        filtered_audio = filtfilt(b, a, audio_data)
        
        # Calculate the audio envelope using multiple methods
        # 1. Simple absolute value
        audio_env1 = np.abs(filtered_audio)
        
        # 2. Hilbert transform for better envelope detection
        try:
            from scipy.signal import hilbert
            analytic_signal = hilbert(filtered_audio)
            audio_env2 = np.abs(analytic_signal)
        except ImportError:
            audio_env2 = audio_env1
        
        # 3. Energy-based envelope
        window_size = int(sample_rate * 0.01)  # 10ms window
        audio_env3 = np.convolve(filtered_audio**2, np.ones(window_size)/window_size, mode='same')
        
        # Combine the three methods for better results
        audio_env = (audio_env1 + audio_env2 + audio_env3) / 3
        
        # Apply a moving average filter to smooth the envelope
        window_size = int(sample_rate * 0.02)  # 20ms window
        audio_env_smooth = np.convolve(audio_env, np.ones(window_size)/window_size, mode='same')
        
        # Normalize the envelope
        audio_env_norm = audio_env_smooth / np.max(audio_env_smooth)
        
        # Find peaks in the envelope (potential word boundaries)
        # Use adaptive thresholding
        threshold = np.mean(audio_env_norm) * 1.5
        min_distance = int(sample_rate * 0.15)  # Minimum 150ms between words
        
        peaks, properties = find_peaks(audio_env_norm, height=threshold, distance=min_distance, 
                                      prominence=0.1, width=5)
        
        # Convert peak indices to time in seconds
        peak_times = peaks / sample_rate
        
        # Add start and end times
        if len(peak_times) > 0:
            # Add a small offset to the first peak to account for the start of the audio
            peak_times = np.insert(peak_times, 0, 0.1)
            
            # Add the end of the audio
            audio_duration = len(audio_data) / sample_rate
            peak_times = np.append(peak_times, audio_duration - 0.1)
        
        logger.info(f"Detected {len(peak_times)} potential word boundaries")
        return peak_times
        
    except Exception as e:
        logger.error(f"Error in enhanced word boundary detection: {str(e)}")
        return np.array([])

def try_vosk_recognition(wav_file):
    """
    Attempt to use Vosk for offline speech recognition with word timestamps
    Returns None if Vosk is not available or fails
    """
    try:
        # Check if Vosk is installed
        try:
            from vosk import Model, KaldiRecognizer
        except ImportError:
            logger.info("Vosk not installed, skipping Vosk recognition")
            return None
        
        # Check if model exists
        model_path = os.path.join(os.path.dirname(__file__), "vosk-model-small-en-us")
        if not os.path.exists(model_path):
            logger.info("Vosk model not found, downloading...")
            # Create model directory
            os.makedirs(model_path, exist_ok=True)
            
            # Download model (this is a simplified approach - in production, you'd want to handle this more robustly)
            try:
                import urllib.request
                import zipfile
                
                # Download the small English model
                model_url = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
                zip_path = os.path.join(os.path.dirname(__file__), "vosk-model.zip")
                
                logger.info(f"Downloading Vosk model from {model_url}...")
                urllib.request.urlretrieve(model_url, zip_path)
                
                # Extract the model
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    zip_ref.extractall(os.path.dirname(__file__))
                
                # Clean up
                os.remove(zip_path)
                logger.info("Vosk model downloaded and extracted successfully")
            except Exception as e:
                logger.error(f"Failed to download Vosk model: {str(e)}")
                return None
        
        # Read the WAV file
        sample_rate, audio_data = wavfile.read(wav_file)
        
        # Convert to mono if stereo
        if len(audio_data.shape) > 1:
            audio_data = audio_data.mean(axis=1)
        
        # Convert to 16-bit PCM
        audio_data = (audio_data * 32768).astype(np.int16)
        
        # Initialize Vosk model and recognizer
        model = Model(model_path)
        recognizer = KaldiRecognizer(model, sample_rate)
        recognizer.SetWords(True)  # Enable word timestamps
        
        # Process audio in chunks
        chunk_size = 4000
        chunks = [audio_data[i:i+chunk_size] for i in range(0, len(audio_data), chunk_size)]
        
        # Process each chunk
        for chunk in chunks:
            recognizer.AcceptWaveform(chunk.tobytes())
        
        # Get final result
        result = json.loads(recognizer.FinalResult())
        
        if 'result' in result and result['result']:
            # Extract words with timestamps
            words = []
            for word in result['result']:
                words.append({
                    "word": word['word'],
                    "startTime": round(word['start'], 2),
                    "endTime": round(word['end'], 2),
                    "confidence": word.get('conf', 0.8),
                    "source": "vosk"
                })
            
            # Get full text
            text = ' '.join([word['word'] for word in result['result']])
            
            return {
                "text": text,
                "words": words,
                "duration": len(audio_data) / sample_rate,
                "source": "vosk"
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Vosk recognition error: {str(e)}")
        return None

def try_whisper_recognition(wav_file):
    """
    Attempt to use OpenAI's Whisper for speech recognition with word timestamps
    Returns None if Whisper is not available or fails
    """
    try:
        # Check if Whisper is installed
        try:
            import whisper
        except ImportError:
            logger.info("Whisper not installed, skipping Whisper recognition")
            return None
        
        logger.info("Attempting Whisper recognition...")
        
        # Load the model (small model for speed)
        model = whisper.load_model("base")
        
        # Transcribe with word-level timestamps
        result = model.transcribe(wav_file, language="en", word_timestamps=True)
        
        if result and 'text' in result and 'segments' in result:
            # Extract words with timestamps
            words = []
            for segment in result['segments']:
                for word in segment['words']:
                    words.append({
                        "word": word['word'].strip(),
                        "startTime": round(word['start'], 2),
                        "endTime": round(word['end'], 2),
                        "confidence": segment.get('confidence', 0.8),
                        "source": "whisper"
                    })
            
            return {
                "text": result['text'],
                "words": words,
                "duration": result.get('duration', 0),
                "source": "whisper"
            }
        
        return None
        
    except Exception as e:
        logger.error(f"Whisper recognition error: {str(e)}")
        return None

def transcribe_audio(audio_file):
    """Transcribe audio file using multiple recognition engines for best results"""
    try:
        # Convert to WAV if needed
        wav_file = convert_to_wav(audio_file)
        
        logger.info(f"Starting transcription of {wav_file}")
        
        # Get audio duration
        audio_duration = AudioSegment.from_wav(wav_file).duration_seconds
        
        # Try multiple recognition engines in order of preference
        results = []
        
        # 1. Try Whisper (best for word timestamps)
        whisper_result = try_whisper_recognition(wav_file)
        if whisper_result and whisper_result['words']:
            logger.info("Whisper recognition successful with word timestamps")
            results.append(whisper_result)
        
        # 2. Try Vosk (good offline option with timestamps)
        vosk_result = try_vosk_recognition(wav_file)
        if vosk_result and vosk_result['words']:
            logger.info("Vosk recognition successful with word timestamps")
            results.append(vosk_result)
        
        # Select the best result
        if results:
            # Prefer results with word timestamps
            for result in results:
                if result['source'] in ['whisper', 'vosk'] and result['words']:
                    logger.info(f"Selected {result['source']} result with word timestamps")
                    return result
            
            # Fall back to any available result
            logger.info("Falling back to available result")
            return results[0]
        else:
            # No results from any engine
            return {
                "text": "",
                "words": [],
                "duration": audio_duration,
                "error": "Could not transcribe audio with any available engine",
                "source": "error"
            }
            
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return {
            "text": "",
            "words": [],
            "duration": 0,
            "error": str(e),
            "source": "error"
        }
    finally:
        # Clean up temporary file
        try:
            if 'wav_file' in locals():
                os.unlink(wav_file)
        except:
            pass

def create_distributed_word_timings(words, audio_duration):
    """Create word timing estimates with improved distribution algorithm"""
    word_objects = []
    
    if not words:
        return word_objects
    
    # Account for pauses and natural speech patterns
    # Assume 25% of time is pauses/silence (increased from 20%)
    speech_duration = audio_duration * 0.75
    
    # Calculate word durations based on multiple factors
    word_durations = []
    
    # 1. Character length (longer words take more time)
    char_weights = [len(word) for word in words]
    
    # 2. Syllable count (words with more syllables take more time)
    syllable_counts = [count_syllables(word) for word in words]
    
    # 3. Word frequency (common words are spoken faster)
    frequency_weights = [get_word_frequency_weight(word) for word in words]
    
    # Combine all factors with appropriate weights
    for i in range(len(words)):
        # Base duration on character length (50% weight)
        char_duration = (char_weights[i] / sum(char_weights)) * speech_duration * 0.5
        
        # Adjust for syllable count (30% weight)
        syllable_duration = (syllable_counts[i] / sum(syllable_counts)) * speech_duration * 0.3
        
        # Adjust for word frequency (20% weight)
        freq_duration = (frequency_weights[i] / sum(frequency_weights)) * speech_duration * 0.2
        
        # Combine all factors
        total_duration = char_duration + syllable_duration + freq_duration
        
        # Ensure minimum duration
        total_duration = max(total_duration, 0.2)  # Minimum 200ms per word
        
        word_durations.append(total_duration)
    
    # Distribute pause time between words
    total_word_duration = sum(word_durations)
    remaining_time = speech_duration - total_word_duration
    
    # Add pause time between words
    pause_times = []
    if len(words) > 1:
        # Distribute pause time based on word complexity
        complexity_weights = [char_weights[i] + syllable_counts[i] for i in range(len(words))]
        total_complexity = sum(complexity_weights)
        
        for i in range(len(words) - 1):
            # More complex words get more pause time after them
            pause_time = (complexity_weights[i] / total_complexity) * remaining_time
            pause_times.append(pause_time)
    else:
        pause_times = [0]
    
    # Create word objects with timestamps
    current_time = 0.0
    for i, word in enumerate(words):
        start_time = current_time
        end_time = start_time + word_durations[i]
        
        word_objects.append({
            "word": word.strip('.,!?;:"()[]'),  # Clean punctuation
            "startTime": round(start_time, 2),
            "endTime": round(end_time, 2),
            "confidence": 0.5,  # Lower confidence for distributed timings
            "source": "distribution"
        })
        
        # Add pause time after this word (except for the last word)
        if i < len(words) - 1:
            current_time = end_time + pause_times[i]
        else:
            current_time = end_time
    
    return word_objects

def count_syllables(word):
    """Count the number of syllables in a word"""
    word = word.lower()
    count = 0
    vowels = "aeiouy"
    
    # Handle special cases
    if word.endswith("e"):
        word = word[:-1]
    
    # Count vowel groups
    prev_char_is_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_char_is_vowel:
            count += 1
        prev_char_is_vowel = is_vowel
    
    # Ensure at least one syllable
    return max(count, 1)

def get_word_frequency_weight(word):
    """Get a weight based on word frequency (common words are spoken faster)"""
    # Common English words (top 100)
    common_words = {
        "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", 
        "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
        "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
        "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
        "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
        "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
        "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
        "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
        "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
        "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
    }
    
    # Return a lower weight for common words (they're spoken faster)
    return 0.7 if word.lower() in common_words else 1.0

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python speech_recognition_script.py <audio_file>"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    
    if not os.path.exists(audio_file):
        print(json.dumps({"error": f"Audio file not found: {audio_file}"}))
        sys.exit(1)
    
    try:
        result = transcribe_audio(audio_file)
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            "error": str(e),
            "text": "",
            "words": [],
            "duration": 0,
            "source": "error"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
