const fs = require("fs");
const path = require("path");
const Audio = require("../models/Audio");

class AudioStorageService {
  constructor() {
    this.uploadsDir = path.join(__dirname, "../uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Save audio file information to MongoDB
   * @param {Object} fileInfo - Information about the uploaded file
   * @param {string} userId - User ID who uploaded the file
   * @returns {Promise<Object>} - The saved audio document
   */
  async saveAudioFile(fileInfo, userId) {
    try {
      const audio = new Audio({
        userId,
        originalName: fileInfo.originalName,
        filename: fileInfo.filename,
        filePath: fileInfo.path,
        fileSize: fileInfo.size,
        mimeType: fileInfo.mimetype,
      });

      const savedAudio = await audio.save();
      return savedAudio;
    } catch (error) {
      console.error("Error saving audio file to database:", error);
      throw new Error("Failed to save audio file information");
    }
  }

  /**
   * Update audio file with processed information
   * @param {string} audioId - ID of the audio document
   * @param {Object} processedInfo - Information about the processed file
   * @returns {Promise<Object>} - The updated audio document
   */
  async updateProcessedAudio(audioId, processedInfo) {
    try {
      const audio = await Audio.findById(audioId);

      if (!audio) {
        throw new Error("Audio file not found");
      }

      audio.isProcessed = true;
      audio.processedFilePath = processedInfo.path;
      audio.processedFilename = processedInfo.filename;

      if (processedInfo.transcription) {
        audio.transcription = processedInfo.transcription;
      }

      if (processedInfo.replacements) {
        audio.replacements = processedInfo.replacements;
      }

      const updatedAudio = await audio.save();
      return updatedAudio;
    } catch (error) {
      console.error("Error updating processed audio:", error);
      throw new Error("Failed to update processed audio information");
    }
  }

  /**
   * Get all audio files for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of audio documents
   */
  async getUserAudios(userId) {
    try {
      const audios = await Audio.find({ userId }).sort({ createdAt: -1 });
      return audios;
    } catch (error) {
      console.error("Error fetching user audio files:", error);
      throw new Error("Failed to fetch user audio files");
    }
  }

  /**
   * Get a specific audio file by ID
   * @param {string} audioId - Audio document ID
   * @returns {Promise<Object>} - Audio document
   */
  async getAudioById(audioId) {
    try {
      const audio = await Audio.findById(audioId);

      if (!audio) {
        throw new Error("Audio file not found");
      }

      return audio;
    } catch (error) {
      console.error("Error fetching audio file:", error);
      throw new Error("Failed to fetch audio file");
    }
  }

  /**
   * Delete an audio file and its database record
   * @param {string} audioId - Audio document ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteAudio(audioId) {
    try {
      const audio = await Audio.findById(audioId);

      if (!audio) {
        throw new Error("Audio file not found");
      }

      // Delete the original file
      if (fs.existsSync(audio.filePath)) {
        fs.unlinkSync(audio.filePath);
      }

      // Delete the processed file if it exists
      if (audio.processedFilePath && fs.existsSync(audio.processedFilePath)) {
        fs.unlinkSync(audio.processedFilePath);
      }

      // Delete the database record
      await Audio.findByIdAndDelete(audioId);

      return true;
    } catch (error) {
      console.error("Error deleting audio file:", error);
      throw new Error("Failed to delete audio file");
    }
  }
}

module.exports = new AudioStorageService();
