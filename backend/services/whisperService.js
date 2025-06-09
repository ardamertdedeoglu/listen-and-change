const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class WhisperService {
    constructor() {
        this.pythonPath = 'python'; // Adjust if needed
        this.whisperInstalled = false;
        this.checkWhisperInstallation();
    }

    async checkWhisperInstallation() {
        try {
            await this.runPythonCommand(['-c', 'import whisper; print("Whisper is available")']);
            this.whisperInstalled = true;
            console.log('✅ Whisper is available');
        } catch (error) {
            console.log('❌ Whisper not found. Install with: pip install openai-whisper');
            this.whisperInstalled = false;
        }
    }

    async transcribeAudio(audioFilePath) {
        try {
            if (!this.whisperInstalled) {
                console.log('Whisper not available, using mock data...');
                return this.getMockTranscription(audioFilePath);
            }

            // Create Python script for Whisper
            const pythonScript = this.createWhisperScript();
            const scriptPath = path.join(__dirname, 'whisper_transcribe.py');
            fs.writeFileSync(scriptPath, pythonScript);

            // Run Whisper transcription
            const result = await this.runPythonCommand([scriptPath, audioFilePath]);
            const transcriptionData = JSON.parse(result);

            // Clean up script
            fs.unlinkSync(scriptPath);

            return {
                text: transcriptionData.text,
                words: transcriptionData.segments.flatMap(segment => 
                    segment.words ? segment.words.map(word => ({
                        word: word.word.trim(),
                        startTime: word.start,
                        endTime: word.end,
                        confidence: word.probability || 0.9
                    })) : []
                ),
                language: transcriptionData.language,
                confidence: transcriptionData.segments.reduce((avg, seg) => avg + (seg.avg_logprob || 0), 0) / transcriptionData.segments.length
            };

        } catch (error) {
            console.error('Whisper transcription error:', error);
            return this.getMockTranscription(audioFilePath);
        }
    }

    createWhisperScript() {
        return `
import whisper
import json
import sys
import warnings
warnings.filterwarnings("ignore")

def transcribe_audio(audio_path):
    try:
        # Load Whisper model (base model for balance of speed and accuracy)
        model = whisper.load_model("base")
        
        # Transcribe with word-level timestamps
        result = model.transcribe(
            audio_path, 
            word_timestamps=True,
            verbose=False
        )
        
        return {
            "text": result["text"],
            "language": result["language"],
            "segments": result["segments"]
        }
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python whisper_transcribe.py <audio_file>", file=sys.stderr)
        sys.exit(1)
    
    audio_file = sys.argv[1]
    result = transcribe_audio(audio_file)
    
    if result:
        print(json.dumps(result, ensure_ascii=False))
    else:
        sys.exit(1)
`;
    }

    async runPythonCommand(args) {
        return new Promise((resolve, reject) => {
            const python = spawn(this.pythonPath, args);
            let stdout = '';
            let stderr = '';

            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            python.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Python script failed: ${stderr}`));
                }
            });

            python.on('error', (error) => {
                reject(error);
            });
        });
    }

    getMockTranscription(audioFilePath) {
        // Generate more realistic mock data based on file
        const filename = path.basename(audioFilePath);
        const fileSize = fs.existsSync(audioFilePath) ? fs.statSync(audioFilePath).size : 1000;
        
        // Estimate duration roughly (very rough estimate)
        const estimatedDuration = Math.max(2, Math.min(30, fileSize / 50000));
        
        const mockWords = [
            "Hello", "everyone", "this", "is", "a", "test", "audio", "file",
            "with", "some", "words", "that", "might", "need", "replacement",
            "damn", "this", "is", "pretty", "cool", "stuff"
        ];

        const words = mockWords.map((word, index) => ({
            word: word,
            startTime: (index * estimatedDuration) / mockWords.length,
            endTime: ((index + 1) * estimatedDuration) / mockWords.length,
            confidence: 0.8 + Math.random() * 0.2
        }));

        return {
            text: mockWords.join(" "),
            words: words,
            language: "en",
            confidence: 0.85,
            source: "mock"
        };
    }
}

module.exports = new WhisperService();
