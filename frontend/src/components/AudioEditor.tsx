import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  TextField,
  FormControl,
  Alert,
  CircularProgress,
  LinearProgress,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  CloudUpload,
  PlayArrow,
  Pause,
  Stop,
  Download,
  Delete,
  VolumeUp,
  Edit,
  Check,
  Close,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import WaveSurfer from 'wavesurfer.js';
import { useAuth } from '../contexts/AuthContext';

interface WordReplacement {
  id: string;
  originalWord: string;
  replacementWord: string;
  position: number;
  startTime: number;
  endTime: number;
  suggestions: string[];
  selected: boolean;
}

interface TranscriptionWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

interface ProcessedAudioFile {
  filename: string;
  path: string;
  downloadUrl: string;
}

const AudioEditor: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [transcriptionWords, setTranscriptionWords] = useState<TranscriptionWord[]>([]);
  const [replacements, setReplacements] = useState<WordReplacement[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedFile, setProcessedFile] = useState<ProcessedAudioFile | null>(null);
  
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }

      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4FC3F7',
        progressColor: '#81C784',
        cursorColor: '#FF7043',
        height: 80,
        normalize: true,
      });

      wavesurfer.current.load(audioUrl);

      wavesurfer.current.on('ready', () => {
        console.log('WaveSurfer is ready');
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  // File drop zone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop: handleFileUpload,
    multiple: false
  });
  async function handleFileUpload(acceptedFiles: File[]) {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('🔄 New file upload started, clearing previous state...');
    
    // Clear all previous state
    setError('');
    setLoading(true);
    setUploadProgress(0);
    setTranscription('');
    setTranscriptionWords([]);
    setReplacements([]);
    setProcessedFile(null);
    setAudioFile(null);
    setUploadedFilename('');
    setAudioUrl('');
    setIsPlaying(false);

    // Destroy existing wavesurfer instance
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
      wavesurfer.current = null;
    }

    try {
      const formData = new FormData();
      formData.append('audio', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('http://localhost:3001/api/audio/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setAudioFile(file);
        setUploadedFilename(data.file.filename);
        setAudioUrl(URL.createObjectURL(file));
        
        // Start speech-to-text processing
        await processSpeechToText(data.file.filename);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setError('Failed to upload audio file');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }

  async function processSpeechToText(filename: string) {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/audio/speech-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranscription(data.transcription.text);
        setTranscriptionWords(data.transcription.words || []);
        
        // Analyze text for inappropriate words
        await analyzeText(data.transcription.text);
      } else {
        throw new Error('Speech-to-text failed');
      }
    } catch (error) {
      setError('Failed to process speech-to-text');
      console.error('Speech-to-text error:', error);
    } finally {
      setLoading(false);
    }
  }
  async function analyzeText(text: string) {
    try {
      console.log('Analyzing text:', text);
      const response = await fetch('http://localhost:3001/api/audio/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Analysis response:', data);
        
        // Access suggestions from the root level, not nested under analysis
        const suggestions = data.suggestions || [];
        console.log('Found suggestions:', suggestions);
        
        const newReplacements: WordReplacement[] = suggestions.map((suggestion: any, index: number) => {
          // Find the word in transcription
          const wordIndex = transcriptionWords.findIndex(w => 
            w.word.toLowerCase() === suggestion.originalWord.toLowerCase()
          );
          
          return {
            id: `replacement-${index}`,
            originalWord: suggestion.originalWord,
            replacementWord: suggestion.recommended,
            position: wordIndex >= 0 ? wordIndex : suggestion.position,
            startTime: wordIndex >= 0 ? transcriptionWords[wordIndex].startTime : 0,
            endTime: wordIndex >= 0 ? transcriptionWords[wordIndex].endTime : 0,
            suggestions: suggestion.suggestions || [],
            selected: false,
          };
        });
        
        console.log('Generated replacements:', newReplacements);
        setReplacements(newReplacements);
      } else {
        console.error('Analysis failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Text analysis error:', error);
    }
  }

  const handlePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const handleStop = () => {
    if (wavesurfer.current) {
      wavesurfer.current.stop();
    }
  };

  const handleReplacementToggle = (id: string) => {
    setReplacements(prev => 
      prev.map(replacement => 
        replacement.id === id 
          ? { ...replacement, selected: !replacement.selected }
          : replacement
      )
    );
  };

  const handleReplacementChange = (id: string, newReplacement: string) => {
    setReplacements(prev => 
      prev.map(replacement => 
        replacement.id === id 
          ? { ...replacement, replacementWord: newReplacement }
          : replacement
      )
    );
  };

  const handleRemoveReplacement = (id: string) => {
    setReplacements(prev => prev.filter(replacement => replacement.id !== id));
  };

  const handleProcessAudio = async () => {
    const selectedReplacements = replacements.filter(r => r.selected);
    
    if (!audioFile || !uploadedFilename || selectedReplacements.length === 0) {
      setError('Please select words to replace before processing');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/audio/process-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: uploadedFilename,
          replacements: selectedReplacements.map(r => ({
            originalWord: r.originalWord,
            replacementText: r.replacementWord,
            startTime: r.startTime,
            endTime: r.endTime
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProcessedFile({
          filename: data.processedFile,
          path: data.processedFile,
          downloadUrl: data.downloadUrl
        });
        
        alert('Audio processed successfully!');
      } else {
        throw new Error('Audio processing failed');
      }
    } catch (error) {
      setError('Failed to process audio');
      console.error('Audio processing error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedFile) {
      const link = document.createElement('a');
      link.href = `http://localhost:3001${processedFile.downloadUrl}`;
      link.download = `processed-${audioFile?.name || 'audio'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please log in to access the audio editor.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Audio Content Editor
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* File Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: isDragActive ? '2px dashed #4FC3F7' : '2px dashed #ccc',
          backgroundColor: isDragActive ? '#f8f9fa' : 'background.paper',
          cursor: 'pointer',
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the audio file here...'
            : 'Drag & drop an audio file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: MP3, WAV, M4A, OGG (Max: 50MB)
        </Typography>

        {uploadProgress > 0 && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading: {uploadProgress}%
            </Typography>
          </Box>
        )}
      </Paper>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Processing audio...</Typography>
        </Box>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Audio Player
            </Typography>
            <Box ref={waveformRef} sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={isPlaying ? <Pause /> : <PlayArrow />}
                onClick={handlePlayPause}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Stop />}
                onClick={handleStop}
              >
                Stop
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Transcription */}
      {transcription && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transcription
            </Typography>
            <Typography variant="body1" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {transcription}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Word Replacements */}
      {replacements.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Word Replacements
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the words you want to replace and customize the replacement text:
            </Typography>
            
            <List>
              {replacements.map((replacement) => (
                <React.Fragment key={replacement.id}>
                  <ListItem>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={replacement.selected}
                          onChange={() => handleReplacementToggle(replacement.id)}
                        />
                      }
                      label=""
                      sx={{ mr: 2 }}
                    />
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Chip 
                            label={replacement.originalWord}
                            color="error"
                            variant="outlined"
                          />
                          <Typography>→</Typography>
                          <TextField
                            size="small"
                            value={replacement.replacementWord}
                            onChange={(e) => handleReplacementChange(replacement.id, e.target.value)}
                            disabled={!replacement.selected}
                            placeholder="Enter replacement word"
                            sx={{ minWidth: 150 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            ({replacement.startTime.toFixed(1)}s - {replacement.endTime.toFixed(1)}s)
                          </Typography>
                        </Box>
                      }
                      secondary={
                        replacement.suggestions.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption">Suggestions: </Typography>
                            {replacement.suggestions.map((suggestion, index) => (
                              <Chip
                                key={index}
                                label={suggestion}
                                size="small"
                                variant="outlined"
                                onClick={() => replacement.selected && handleReplacementChange(replacement.id, suggestion)}
                                sx={{ mr: 0.5, cursor: replacement.selected ? 'pointer' : 'default' }}
                                disabled={!replacement.selected}
                              />
                            ))}
                          </Box>
                        )
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleRemoveReplacement(replacement.id)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={processing ? <CircularProgress size={20} /> : <VolumeUp />}
                onClick={handleProcessAudio}
                disabled={processing || !replacements.some(r => r.selected)}
              >
                {processing ? 'Processing...' : 'Process Audio'}
              </Button>
              
              {processedFile && (
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={handleDownload}
                >
                  Download Processed Audio
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default AudioEditor;
