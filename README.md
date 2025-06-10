# Listen & Change 🎵🔄

A family-friendly audio content filtering application that identifies and replaces inappropriate words in audio files with suitable alternatives, creating a safer internet environment for children.

## 🌟 Features

- **Speech-to-Text**: Convert spoken words in audio files into text for easy identification
- **Smart Word Detection**: AI-powered analysis to identify inappropriate content in context
- **Audio Editing**: Professional-grade tools for seamless word replacement and sound insertion
- **Text-to-Speech**: Generate natural-sounding replacement audio
- **Waveform Visualization**: Interactive audio waveform for precise editing
- **User Authentication**: Secure user accounts and preferences management
- **Family-Safe Interface**: Intuitive, child-friendly design with calm colors

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- FFmpeg (for audio processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd listen-and-change
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the development servers**

   Backend (runs on http://localhost:5000):
   ```bash
   cd backend
   npm run dev
   ```

   Frontend (runs on http://localhost:3000):
   ```bash
   cd frontend
   npm start
   ```

## 🏗️ Project Structure

```
listen-and-change/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts
│   │   ├── services/         # API services
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── backend/                  # Node.js Express server
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   ├── middleware/          # Express middleware
│   ├── models/              # Data models
│   └── uploads/             # File storage
└── README.md
```

## 🎯 How It Works

1. **Upload Audio**: Drag and drop or select an audio file (MP3, WAV, M4A, OGG)
2. **Speech Analysis**: AI converts speech to text and identifies inappropriate words
3. **Smart Replacement**: Choose family-friendly alternatives or sound effects
4. **Audio Processing**: Generate clean audio with seamless word replacements
5. **Download**: Get your family-friendly audio file

## 🛠️ Technology Stack

### Frontend
- **React** with TypeScript for type-safe development
- **Material-UI** for beautiful, accessible components
- **WaveSurfer.js** for audio waveform visualization
- **React Router** for navigation
- **Styled Components** for custom styling

### Backend
- **Node.js** with Express for robust server architecture
- **Multer** for secure file upload handling
- **FFmpeg** for professional audio processing
- **JWT** for secure authentication
- **Natural/Compromise.js** for advanced text analysis

### External APIs (Production)
- **OpenAI's Whisper** for accurate transcription with word timestamps
- **Vosk** for offline speech recognition with word timestamps
- **Google Cloud Text-to-Speech** for natural voice synthesis

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=your-secret-key

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# External APIs (for production)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

## 🎨 Design Guidelines

- **Color Palette**: Soft blues (#4FC3F7) and greens (#81C784) for a calm, family-friendly atmosphere
- **Typography**: Clean sans-serif fonts (Inter, Roboto) for excellent readability
- **Layout**: Prominent audio waveform display with intuitive controls
- **Navigation**: Clear top navigation with easy access to all features

## 🔒 Security Features

- **File Validation**: Strict file type and size validation
- **Secure Authentication**: JWT-based user authentication
- **Input Sanitization**: Protection against XSS and injection attacks
- **Rate Limiting**: API protection against abuse
- **Secure File Storage**: Safe handling of uploaded audio files

## 📱 User Experience

### Target Users
- **Parents** seeking to create family-friendly content
- **Educators** preparing safe educational materials
- **Content Creators** ensuring appropriate audience content
- **Friends** having fun with audio editing

### User Flow
1. Launch application with welcoming interface
2. Upload audio file with drag-and-drop support
3. Review automatic transcription and word detection
4. Select replacement words from suggested alternatives
5. Preview changes with integrated audio player
6. Export clean, family-friendly audio file

## 🚧 Development Status

### ✅ Completed Features
- Complete project setup with React frontend and Node.js backend
- User authentication system with JWT
- File upload with progress tracking
- Audio waveform visualization
- Speech-to-text integration (mock implementation)
- NLP-based word detection and analysis
- Interactive word replacement interface
- Material-UI design system implementation

### 🔄 In Progress
- Audio processing with FFmpeg integration
- Database integration for user preferences
- Advanced audio effects and filters

### 📋 Future Enhancements
- Real-time audio processing
- Advanced audio effects
- Integration with cloud storage
- Mobile application
- Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Join our community discussions

## �� Acknowledgments

- OpenAI for the Whisper speech recognition model
- Vosk for offline speech recognition capabilities
- WaveSurfer.js for excellent audio visualization
- Material-UI team for beautiful components
- Natural and Compromise.js for NLP capabilities
- The open-source community for amazing tools and libraries

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
