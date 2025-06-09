<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Listen & Change - Audio Content Filtering Application

## Project Overview
This is a sound file editing application that identifies specific words in audio files and replaces them with family-friendly alternatives. The application helps parents create a safer internet environment for their children while enabling fun interactions among friends.

## Technical Stack
- **Frontend**: React with TypeScript, Material-UI, WaveSurfer.js for audio visualization
- **Backend**: Node.js with Express, Multer for file uploads, FFmpeg for audio processing
- **Speech Recognition**: Google Cloud Speech-to-Text API (with mock implementation for demo)
- **NLP**: Natural library and Compromise.js for text analysis
- **TTS**: Google Cloud Text-to-Speech API (with mock implementation for demo)

## Key Features
- Speech-to-Text conversion for audio file analysis
- Natural Language Processing for context-aware word identification
- Audio editing with word replacement capabilities
- Text-to-Speech generation for replacement words
- User-friendly interface with audio waveform visualization
- User authentication and preferences management

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices with hooks and functional components
- Use Material-UI components for consistent design
- Implement proper error handling and loading states
- Use semantic HTML and accessible design patterns

### Audio Processing
- Support common audio formats: MP3, WAV, M4A, OGG
- Implement proper file size limits (50MB max)
- Use FFmpeg for audio manipulation and format conversion
- Maintain audio quality during processing

### API Design
- RESTful API endpoints with proper HTTP status codes
- Implement proper authentication using JWT tokens
- Use middleware for request validation and error handling
- Support file uploads with progress tracking

### Security Considerations
- Validate all user inputs
- Sanitize uploaded files
- Implement rate limiting for API endpoints
- Use secure token-based authentication
- Protect against common vulnerabilities (XSS, CSRF, etc.)

### Performance
- Implement efficient audio processing workflows
- Use streaming for large file uploads
- Optimize React components with proper memoization
- Implement proper loading states and progress indicators

## File Structure
```
/frontend - React TypeScript application
  /src/components - Reusable UI components
  /src/contexts - React contexts for state management
  /src/services - API service functions
  /src/types - TypeScript type definitions

/backend - Node.js Express server
  /routes - API route handlers
  /services - Business logic services
  /middleware - Express middleware functions
  /models - Data models (future database integration)
```

## Environment Variables
- Set up proper environment variables for API keys and configuration
- Use different configurations for development and production
- Store sensitive data like JWT secrets securely

## Testing
- Write unit tests for critical business logic
- Test API endpoints with proper error scenarios
- Test audio processing workflows
- Implement integration tests for the complete user flow

When working on this project, prioritize user experience, family safety, and reliable audio processing functionality.
