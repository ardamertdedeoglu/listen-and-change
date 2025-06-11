# MongoDB Integration for Audio Files

This document explains how to set up and use MongoDB for storing audio files in the Listen and Change application.

## Overview

The application now stores audio files in MongoDB, allowing users to:
- Upload audio files and associate them with their account
- Process audio files and store the results
- View their history of uploaded and processed audio files
- Download original and processed audio files

## Database Schema

### Audio Model

The `Audio` model stores information about uploaded and processed audio files:

```javascript
{
  userId: ObjectId,        // Reference to the User who uploaded the file
  originalName: String,    // Original filename
  filename: String,        // Generated filename on server
  filePath: String,        // Path to the file on server
  fileSize: Number,        // File size in bytes
  mimeType: String,        // MIME type of the file
  isProcessed: Boolean,    // Whether the file has been processed
  processedFilePath: String, // Path to the processed file
  processedFilename: String, // Filename of the processed file
  transcription: String,   // Transcription of the audio
  replacements: [{         // Array of word replacements
    originalWord: String,
    replacementText: String,
    startTime: Number,
    endTime: Number
  }],
  createdAt: Date          // When the file was uploaded
}
```

## API Endpoints

### Audio Upload

- **POST /api/audio/upload**
  - Protected route (requires authentication)
  - Uploads an audio file and saves it to the server and MongoDB
  - Returns the file information and the MongoDB document ID

### Get User's Audio Files

- **GET /api/audio/my-audios**
  - Protected route (requires authentication)
  - Returns all audio files uploaded by the authenticated user

### Get Specific Audio File

- **GET /api/audio/:audioId**
  - Protected route (requires authentication)
  - Returns information about a specific audio file
  - Checks if the user owns the file

### Delete Audio File

- **DELETE /api/audio/:audioId**
  - Protected route (requires authentication)
  - Deletes an audio file and its MongoDB record
  - Checks if the user owns the file

### Speech-to-Text

- **POST /api/audio/speech-to-text**
  - Protected route (requires authentication)
  - Converts speech to text and updates the MongoDB record
  - Requires audioId in the request body

### Analyze Text

- **POST /api/audio/analyze-text**
  - Protected route (requires authentication)
  - Analyzes text and identifies words to replace
  - Requires text, targetWords, and audioId in the request body

### Process Audio

- **POST /api/audio/process-audio**
  - Protected route (requires authentication)
  - Processes audio with word replacements
  - Requires audioId and replacements in the request body
  - Updates the MongoDB record with processed file information

### Download Original Audio

- **GET /api/audio/original/:audioId**
  - Protected route (requires authentication)
  - Serves the original audio file
  - Checks if the user owns the file

### Download Processed Audio

- **GET /api/audio/processed/:audioId**
  - Protected route (requires authentication)
  - Serves the processed audio file
  - Checks if the user owns the file

## Frontend Integration

The frontend has been updated to work with the new MongoDB-based audio storage:

1. **UserAudios Component**: Displays all audio files uploaded by the user
2. **AudioEditor Component**: Updated to use the new API endpoints
3. **Navbar**: Added a link to the user's audio files

## Security Considerations

- All audio-related routes are protected with authentication
- Users can only access their own audio files
- File ownership is verified before any operation
- JWT tokens are used for authentication

## File Storage

While the audio file metadata is stored in MongoDB, the actual audio files are still stored on the server's filesystem. This approach provides a good balance between database efficiency and file access performance.

## Future Improvements

- Implement file streaming for better performance
- Add pagination for large collections of audio files
- Implement file compression to reduce storage requirements
- Add file expiration policies to automatically clean up old files 