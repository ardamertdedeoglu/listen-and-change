const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedFilePath: {
    type: String
  },
  processedFilename: {
    type: String
  },
  transcription: {
    type: String
  },
  replacements: [{
    originalWord: String,
    replacementText: String,
    startTime: Number,
    endTime: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Audio = mongoose.model('Audio', audioSchema);

module.exports = Audio; 