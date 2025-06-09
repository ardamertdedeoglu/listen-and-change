const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TTSService {
    constructor() {
        this.scriptPath = path.join(__dirname, 'tts_script.py');
    }

    async generateSpeech(text, outputPath, rate = 150, volume = 0.9) {
        return new Promise((resolve, reject) => {
            console.log(`🎤 Generating TTS for: "${text}"`);
            
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Run Python TTS script
            const pythonProcess = spawn('python', [
                this.scriptPath,
                text,
                outputPath,
                rate.toString(),
                volume.toString()
            ]);

            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output.trim());
                        if (result.success) {
                            console.log('✅ TTS generated successfully');
                            resolve(result);
                        } else {
                            console.error('❌ TTS generation failed:', result.error);
                            reject(new Error(result.error));
                        }
                    } catch (parseError) {
                        console.error('❌ Failed to parse TTS result:', parseError);
                        reject(new Error('Failed to parse TTS result'));
                    }
                } else {
                    console.error('❌ TTS script failed:', errorOutput);
                    reject(new Error(`TTS script failed with code ${code}: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('❌ Failed to start TTS script:', error);
                reject(error);
            });
        });
    }

    async generateMockSpeech(text, outputPath) {
        try {
            console.log(`🎭 Generating mock TTS for: "${text}"`);
            
            // Create a simple WAV file with silence as fallback
            const fs = require('fs');
            const duration = Math.max(0.5, text.split(' ').length * 0.3); // Estimate duration
            
            // Create simple silence audio data (WAV format)
            const sampleRate = 16000;
            const samples = Math.floor(sampleRate * duration);
            const buffer = Buffer.alloc(44 + samples * 2); // WAV header + data
            
            // WAV header
            buffer.write('RIFF', 0);
            buffer.writeUInt32LE(36 + samples * 2, 4);
            buffer.write('WAVE', 8);
            buffer.write('fmt ', 12);
            buffer.writeUInt32LE(16, 16); // PCM format
            buffer.writeUInt16LE(1, 20);  // PCM
            buffer.writeUInt16LE(1, 22);  // Mono
            buffer.writeUInt32LE(sampleRate, 24);
            buffer.writeUInt32LE(sampleRate * 2, 28);
            buffer.writeUInt16LE(2, 32);
            buffer.writeUInt16LE(16, 34);
            buffer.write('data', 36);
            buffer.writeUInt32LE(samples * 2, 40);
            
            // Silent audio data (all zeros)
            for (let i = 44; i < buffer.length; i++) {
                buffer[i] = 0;
            }
            
            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, buffer);
            
            console.log(`✅ Mock TTS file created: ${outputPath}`);
            
            return {
                success: true,
                output_path: outputPath,
                text: text,
                file_size: buffer.length,
                message: "Mock TTS generated successfully"
            };
            
        } catch (error) {
            console.error('❌ Failed to generate mock TTS:', error);
            throw error;
        }
    }
}

module.exports = new TTSService();