# Listen and Change

A web application that allows users to upload audio files, transcribe them, and replace specific words with custom audio clips.

## Features

- **User Authentication**: Register, login, and manage your account
- **Audio Upload**: Upload audio files in various formats
- **Speech-to-Text**: Automatically transcribe audio to text
- **Word Replacement**: Replace specific words with custom audio clips
- **Audio Processing**: Process audio files with word replacements
- **Audio Library**: View and manage your uploaded and processed audio files
- **Download**: Download original and processed audio files

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- Multer for file uploads
- FFmpeg for audio processing

### Frontend
- React
- Material-UI
- Axios for API requests
- WaveSurfer.js for audio visualization
- React Router for navigation

## Project Structure

```
listen-and-change/
├── backend/                # Backend server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── uploads/            # Uploaded audio files
│   ├── processed/          # Processed audio files
│   ├── server.js           # Entry point
│   └── README_MONGODB_AUDIO.md # MongoDB integration docs
├── frontend/               # Frontend application
│   ├── public/             # Static files
│   ├── src/                # Source code
│   │   ├── components/     # React components
│   │   ├── context/        # React context
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── App.tsx         # Main component
│   │   └── index.tsx       # Entry point
│   ├── package.json        # Dependencies
│   └── tsconfig.json       # TypeScript configuration
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- FFmpeg (for audio processing)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/listen-and-change.git
   cd listen-and-change
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/listen-and-change
   JWT_SECRET=your_jwt_secret
   ```

5. Create a `.env` file in the frontend directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## API Documentation

The API documentation is available in the `backend/README_MONGODB_AUDIO.md` file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Material-UI](https://mui.com/) for the UI components
- [WaveSurfer.js](https://wavesurfer-js.org/) for audio visualization
- [FFmpeg](https://ffmpeg.org/) for audio processing

---

**Making the internet safer for families, one audio file at a time! 👨‍👩‍👧‍👦🎵**

## Recent Improvements

### Word Timestamp Detection

The application has been improved to better detect word timestamps in audio files. The following changes have been made:

1. **Enhanced Speech Recognition**:
   - Added audio analysis to detect word boundaries using signal processing
   - Implemented a fallback mechanism for when speech recognition fails to provide timestamps
   - Added validation and error handling for word timestamps

2. **Improved Word Replacement**:
   - Added validation to prevent overlapping replacements
   - Improved handling of invalid timestamps (0.0s-0.0s)
   - Added better logging and error reporting

3. **Better NLP Processing**:
   - Enhanced word detection to handle multi-word phrases
   - Improved context extraction for better replacement suggestions
   - Added support for custom target words

## Setup

1. Install the required dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```
   cd backend
   npm start
   ```

3. Start the frontend:
   ```
   cd frontend
   npm start
   ```

## Usage

1. Upload an audio file
2. The system will transcribe the audio and detect inappropriate words
3. Select replacement words for each inappropriate word
4. Process the audio to replace the inappropriate words
5. Download the processed audio file

## Troubleshooting

If you encounter issues with word timestamp detection:

1. Check the console logs for error messages
2. Ensure the audio file is clear and has good quality
3. Try using a shorter audio file for testing
4. Check that the Python dependencies are correctly installed
