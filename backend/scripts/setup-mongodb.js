/**
 * MongoDB Setup Script
 * 
 * This script helps set up the MongoDB connection for the Listen and Change application.
 * It creates the necessary collections and indexes for the application.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/listen-and-change';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  return setupDatabase();
})
.then(() => {
  console.log('Database setup completed successfully');
  process.exit(0);
})
.catch((error) => {
  console.error('Error setting up database:', error);
  process.exit(1);
});

/**
 * Set up the database with necessary collections and indexes
 */
async function setupDatabase() {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory');
    }

    // Create processed directory if it doesn't exist
    const processedDir = path.join(__dirname, '../processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
      console.log('Created processed directory');
    }

    // Create User collection with indexes
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    });

    // Create Audio collection with indexes
    const audioSchema = new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      originalName: { type: String, required: true },
      filename: { type: String, required: true },
      filePath: { type: String, required: true },
      fileSize: { type: Number, required: true },
      mimeType: { type: String, required: true },
      isProcessed: { type: Boolean, default: false },
      processedFilePath: { type: String },
      processedFilename: { type: String },
      transcription: { type: String },
      replacements: [{
        originalWord: { type: String },
        replacementText: { type: String },
        startTime: { type: Number },
        endTime: { type: Number }
      }],
      createdAt: { type: Date, default: Date.now }
    });

    // Create models
    const User = mongoose.model('User', userSchema);
    const Audio = mongoose.model('Audio', audioSchema);

    // Create indexes
    await User.createIndexes();
    await Audio.createIndexes();

    console.log('Created User and Audio collections with indexes');

    // Create a test user if none exists
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqDp0.3tXqK8y' // hashed 'password123'
      });
      console.log('Created test user (username: testuser, password: password123)');
    }

    return true;
  } catch (error) {
    console.error('Error in setupDatabase:', error);
    throw error;
  }
} 