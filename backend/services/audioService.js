const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const speechService = require("./speechService");
const ttsService = require("./ttsService");

class AudioService {
  constructor() {
    // Set FFmpeg path if needed (adjust based on your system)
    // ffmpeg.setFfmpegPath('/path/to/ffmpeg');
  }

  async processAudioReplacements(audioFilePath, replacements) {
    try {
      console.log("🎵 Starting real audio processing with FFmpeg...");
      console.log("Replacements to process:", replacements);

      const outputFilename = `processed-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}.wav`;
      const outputPath = path.join(path.dirname(audioFilePath), outputFilename);

      // Check if we have any replacements to process
      if (!replacements || replacements.length === 0) {
        console.log("No replacements needed, copying original file...");
        fs.copyFileSync(audioFilePath, outputPath);
        return {
          filename: outputFilename,
          path: outputPath,
          replacements: [],
        };
      }

      try {
        // Perform real audio processing with TTS replacements
        await this.performWordReplacements(
          audioFilePath,
          outputPath,
          replacements
        );
        console.log("✅ Real audio word replacement completed successfully");

        return {
          filename: outputFilename,
          path: outputPath,
          replacements: replacements,
          processed: true,
        };
      } catch (error) {
        console.log(
          "⚠️ Real audio processing failed, using basic processing:",
          error.message
        );

        // Fallback to basic audio processing
        await this.performBasicAudioProcessing(audioFilePath, outputPath);

        return {
          filename: outputFilename,
          path: outputPath,
          replacements: replacements,
          processed: false,
          note: "Basic processing used - word replacement failed",
        };
      }
    } catch (error) {
      console.error("Audio processing error:", error);
      throw new Error("Failed to process audio");
    }
  }

  async performWordReplacements(inputPath, outputPath, replacements) {
    console.log("🔧 Starting real word replacement processing...");

    try {
      // Filter and sort replacements by start time (process from end to beginning to avoid timing shifts)
      const sortedReplacements = replacements
        .filter(
          (r) =>
            r.startTime !== undefined &&
            r.endTime !== undefined &&
            r.startTime < r.endTime
        )
        .sort((a, b) => b.startTime - a.startTime);

      console.log(`Processing ${sortedReplacements.length} word replacements`);

      if (sortedReplacements.length === 0) {
        // No valid replacements, just copy the file
        fs.copyFileSync(inputPath, outputPath);
        return;
      }

      // Validate replacements to ensure they don't overlap
      const validatedReplacements =
        this.validateReplacements(sortedReplacements);
      console.log(
        `After validation: ${validatedReplacements.length} valid replacements`
      );

      if (validatedReplacements.length === 0) {
        // No valid replacements after validation, just copy the file
        fs.copyFileSync(inputPath, outputPath);
        return;
      }

      // Create temp directory for processing
      const tempDir = path.join(path.dirname(inputPath), "temp_processing");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      let currentFile = inputPath;

      // Process each replacement sequentially
      for (let i = 0; i < validatedReplacements.length; i++) {
        const replacement = validatedReplacements[i];
        console.log(
          `Processing replacement ${i + 1}/${validatedReplacements.length}: "${
            replacement.originalWord
          }" → "${replacement.replacementText}" at ${replacement.startTime}s-${
            replacement.endTime
          }s`
        );

        try {
          // Generate TTS for the replacement word
          const ttsFilename = `tts_${Date.now()}_${i}.wav`;
          const ttsPath = path.join(tempDir, ttsFilename);

          console.log(`Generating TTS for: "${replacement.replacementText}"`);
          await ttsService.generateSpeech(replacement.replacementText, ttsPath);

          // Verify TTS file was created
          if (!fs.existsSync(ttsPath)) {
            throw new Error("TTS file was not generated");
          }

          // Create output path for this step
          const stepOutput = path.join(tempDir, `step_${i}.wav`);

          // Replace the audio segment
          console.log(
            `Replacing audio segment from ${replacement.startTime}s to ${replacement.endTime}s`
          );
          await this.replaceAudioSegment(
            currentFile,
            ttsPath,
            replacement.startTime,
            replacement.endTime,
            stepOutput
          );

          // Update current file for next iteration
          currentFile = stepOutput;

          console.log(`✅ Replacement ${i + 1} completed`);
        } catch (error) {
          console.error(
            `❌ Failed to process replacement ${i + 1}:`,
            error.message
          );
          // Continue with other replacements
        }
      }

      // Copy final result to output path
      if (currentFile !== inputPath && fs.existsSync(currentFile)) {
        fs.copyFileSync(currentFile, outputPath);
      } else {
        // No successful replacements, copy original
        fs.copyFileSync(inputPath, outputPath);
      }

      // Clean up temp directory
      this.cleanupTempFiles(tempDir);

      console.log("✅ Word replacement processing completed");
    } catch (error) {
      console.error("❌ Word replacement processing failed:", error);
      throw error;
    }
  }

  validateReplacements(replacements) {
    if (!replacements || replacements.length === 0) {
      return [];
    }

    // Sort by start time (ascending)
    const sorted = [...replacements].sort((a, b) => a.startTime - b.startTime);

    // Check for overlapping replacements
    const validated = [];
    let lastEndTime = 0;

    for (const replacement of sorted) {
      // Skip if this replacement starts before the previous one ends
      if (replacement.startTime < lastEndTime) {
        console.log(
          `⚠️ Skipping overlapping replacement: "${replacement.originalWord}" at ${replacement.startTime}s-${replacement.endTime}s (overlaps with previous replacement ending at ${lastEndTime}s)`
        );
        continue;
      }

      // Skip if start time equals end time
      if (replacement.startTime === replacement.endTime) {
        console.log(
          `⚠️ Skipping replacement with zero duration: "${replacement.originalWord}" at ${replacement.startTime}s-${replacement.endTime}s`
        );
        continue;
      }

      // Skip if duration is too short (less than 0.1 seconds)
      if (replacement.endTime - replacement.startTime < 0.1) {
        console.log(
          `⚠️ Skipping replacement with too short duration: "${replacement.originalWord}" at ${replacement.startTime}s-${replacement.endTime}s`
        );
        continue;
      }

      validated.push(replacement);
      lastEndTime = replacement.endTime;
    }

    return validated;
  }

  async performBasicAudioProcessing(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      console.log("🔧 Performing basic audio processing with FFmpeg...");

      ffmpeg(inputPath)
        .audioCodec("pcm_s16le")
        .audioFrequency(44100)
        .audioChannels(2)
        .on("start", (commandLine) => {
          console.log("FFmpeg command:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
        })
        .on("end", () => {
          console.log("✅ FFmpeg processing completed successfully");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ FFmpeg error:", err.message);
          reject(new Error(`Audio processing failed: ${err.message}`));
        })
        .save(outputPath);
    });
  }

  async replaceAudioSegment(
    inputPath,
    replacementPath,
    startTime,
    endTime,
    outputPath
  ) {
    return new Promise((resolve, reject) => {
      console.log(`Replacing audio segment: ${startTime}s to ${endTime}s`);

      // Ensure the replacement audio matches the original sample rate and channels
      const tempReplacementPath = replacementPath.replace(
        ".wav",
        "_normalized.wav"
      );

      // First, normalize the replacement audio to match the input
      ffmpeg(replacementPath)
        .audioCodec("pcm_s16le")
        .audioFrequency(44100)
        .audioChannels(2)
        .on("end", () => {
          // Now perform the actual replacement
          this.performAudioSplicing(
            inputPath,
            tempReplacementPath,
            startTime,
            endTime,
            outputPath
          )
            .then(() => {
              // Clean up temp file
              if (fs.existsSync(tempReplacementPath)) {
                fs.unlinkSync(tempReplacementPath);
              }
              resolve();
            })
            .catch(reject);
        })
        .on("error", (err) => {
          console.error("Audio normalization error:", err);
          reject(err);
        })
        .save(tempReplacementPath);
    });
  }

  async performAudioSplicing(
    inputPath,
    replacementPath,
    startTime,
    endTime,
    outputPath
  ) {
    return new Promise((resolve, reject) => {
      // Create complex filter for audio splicing
      // This will extract the audio before the word to be replaced
      const beforeFilter = `[0:a]atrim=start=0:end=${startTime},asetpts=PTS-STARTPTS[before]`;
      // This will extract the audio after the word to be replaced
      const afterFilter = `[0:a]atrim=start=${endTime},asetpts=PTS-STARTPTS[after]`;
      // This will concatenate the three parts: before, replacement, and after
      const concatFilter = `[before][1:a][after]concat=n=3:v=0:a=1[out]`;

      ffmpeg()
        .input(inputPath)
        .input(replacementPath)
        .complexFilter([beforeFilter, afterFilter, concatFilter])
        .outputOptions(["-map", "[out]"])
        .audioCodec("pcm_s16le")
        .on("start", (commandLine) => {
          console.log("Audio splicing command:", commandLine);
        })
        .on("end", () => {
          console.log("✅ Audio segment replacement complete");
          resolve();
        })
        .on("error", (err) => {
          console.error("❌ Audio splicing error:", err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  }

  async convertAudioFormat(inputPath, outputPath, format = "wav") {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat(format)
        .audioCodec("pcm_s16le")
        .audioFrequency(44100)
        .on("end", () => {
          console.log("Audio conversion complete");
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error("Audio conversion error:", err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  async createSilence(duration, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input("anullsrc=channel_layout=stereo:sample_rate=44100")
        .inputFormat("lavfi")
        .duration(duration)
        .audioCodec("pcm_s16le")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });
  }

  cleanupTempFiles(tempDir) {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach((file) => {
          const filePath = path.join(tempDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
        fs.rmdirSync(tempDir);
        console.log("🧹 Cleaned up temp files");
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

module.exports = new AudioService();
