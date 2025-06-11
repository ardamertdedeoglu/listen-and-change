const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const speechService = require('../services/speechService');
const audioService = require('../services/audioService');
const nlpService = require('../services/nlpService');
const audioStorageService = require('../services/audioStorageService');
const auth = require('../middleware/auth');

// Function to clean up old uploads
function cleanupOldUploads() {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            return;
        }
        
        const files = fs.readdirSync(uploadsDir);
        console.log(`🧹 Cleaning up ${files.length} old files from uploads directory...`);
        
        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            try {
                fs.unlinkSync(filePath);
                console.log(`  ✅ Deleted: ${file}`);
            } catch (error) {
                console.error(`  ❌ Failed to delete ${file}:`, error.message);
            }
        });
        
        console.log('✨ Upload directory cleaned successfully');
    } catch (error) {
        console.error('❌ Error cleaning upload directory:', error);
    }
}

// Function to clean up old processed files (keep only recent ones)
function cleanupOldProcessedFiles() {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    try {
        if (!fs.existsSync(uploadsDir)) {
            return;
        }
        
        const files = fs.readdirSync(uploadsDir);
        const processedFiles = files.filter(file => file.startsWith('processed-'));
        
        if (processedFiles.length > 5) { // Keep only 5 most recent processed files
            console.log(`🧹 Cleaning up old processed files (keeping 5 most recent)...`);
            
            // Sort by modification time and remove oldest
            const fileStats = processedFiles.map(file => ({
                name: file,
                path: path.join(uploadsDir, file),
                mtime: fs.statSync(path.join(uploadsDir, file)).mtime
            })).sort((a, b) => b.mtime - a.mtime);
            
            // Delete files beyond the 5 most recent
            fileStats.slice(5).forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                    console.log(`  ✅ Deleted old processed file: ${file.name}`);
                } catch (error) {
                    console.error(`  ❌ Failed to delete ${file.name}:`, error.message);
                }
            });
        }
    } catch (error) {
        console.error('❌ Error cleaning processed files:', error);
    }
}

// Configure multer for audio uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'audio/mpeg', 
            'audio/wav', 
            'audio/mp3', 
            'audio/x-wav',
            'audio/mp4',
            'audio/m4a',
            'audio/x-m4a',
            'audio/aac',
            'audio/ogg'
        ];
        
        // Also check file extension as a fallback
        const allowedExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.aac', '.ogg'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        } else {
            console.log('Rejected file:', file.originalname, 'MIME:', file.mimetype, 'Extension:', fileExtension);
            cb(new Error(`Invalid file type. Only audio files are allowed. (${file.mimetype})`));
        }
    }
});

// Upload audio file - Protected route
router.post('/upload', auth, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        console.log(`📁 New file uploaded: ${req.file.filename}`);
        
        const audioFile = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        // Save to MongoDB
        const savedAudio = await audioStorageService.saveAudioFile(audioFile, req.user._id);

        res.json({
            message: 'Audio file uploaded successfully',
            file: audioFile,
            audioId: savedAudio._id
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload audio file' });
    }
});

// Get user's audio files - Protected route
router.get('/my-audios', auth, async (req, res) => {
    try {
        const audios = await audioStorageService.getUserAudios(req.user._id);
        res.json({ audios });
    } catch (error) {
        console.error('Error fetching user audio files:', error);
        res.status(500).json({ error: 'Failed to fetch user audio files' });
    }
});

// Get a specific audio file - Protected route
router.get('/:audioId', auth, async (req, res) => {
    try {
        const audio = await audioStorageService.getAudioById(req.params.audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json({ audio });
    } catch (error) {
        console.error('Error fetching audio file:', error);
        res.status(500).json({ error: 'Failed to fetch audio file' });
    }
});

// Delete an audio file - Protected route
router.delete('/:audioId', auth, async (req, res) => {
    try {
        const audio = await audioStorageService.getAudioById(req.params.audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await audioStorageService.deleteAudio(req.params.audioId);
        
        res.json({ message: 'Audio file deleted successfully' });
    } catch (error) {
        console.error('Error deleting audio file:', error);
        res.status(500).json({ error: 'Failed to delete audio file' });
    }
});

// Convert speech to text - Protected route
router.post('/speech-to-text', auth, async (req, res) => {
    try {
        const { audioId } = req.body;
        
        if (!audioId) {
            return res.status(400).json({ error: 'Audio ID is required' });
        }

        const audio = await audioStorageService.getAudioById(audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!fs.existsSync(audio.filePath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }

        const transcription = await speechService.transcribeAudio(audio.filePath);
        
        // Update the audio document with transcription
        await audioStorageService.updateProcessedAudio(audioId, { transcription: transcription.text });
        
        res.json({
            transcription: transcription,
            words: transcription.words || []
        });
    } catch (error) {
        console.error('Speech-to-text error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

// Analyze text and identify words to replace - Protected route
router.post('/analyze-text', auth, async (req, res) => {
    try {
        const { text, targetWords, audioId } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        
        if (!audioId) {
            return res.status(400).json({ error: 'Audio ID is required' });
        }
        
        const audio = await audioStorageService.getAudioById(audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const analysis = await nlpService.analyzeText(text, targetWords);
        
        res.json(analysis);
    } catch (error) {
        console.error('Text analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze text' });
    }
});

// Process audio with replacements - Protected route
router.post('/process-audio', auth, async (req, res) => {
    try {
        const { audioId, replacements } = req.body;
        
        if (!audioId) {
            return res.status(400).json({ error: 'Audio ID is required' });
        }
        
        const audio = await audioStorageService.getAudioById(audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!fs.existsSync(audio.filePath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }
        
        const processedAudio = await audioService.processAudioReplacements(audio.filePath, replacements);
        
        // Update the audio document with processed file information
        await audioStorageService.updateProcessedAudio(audioId, {
            path: processedAudio.path,
            filename: processedAudio.filename,
            replacements: replacements
        });
        
        res.json({
            message: 'Audio processed successfully',
            processedFile: {
                filename: processedAudio.filename,
                path: processedAudio.path
            }
        });
    } catch (error) {
        console.error('Audio processing error:', error);
        res.status(500).json({ error: 'Failed to process audio' });
    }
});

// Get processed audio file - Protected route
router.get('/processed/:audioId', auth, async (req, res) => {
    try {
        const audio = await audioStorageService.getAudioById(req.params.audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!audio.isProcessed || !audio.processedFilePath) {
            return res.status(404).json({ error: 'Processed audio not found' });
        }
        
        if (!fs.existsSync(audio.processedFilePath)) {
            return res.status(404).json({ error: 'Processed audio file not found' });
        }
        
        res.sendFile(audio.processedFilePath);
    } catch (error) {
        console.error('Error fetching processed audio:', error);
        res.status(500).json({ error: 'Failed to fetch processed audio' });
    }
});

// Get original audio file - Protected route
router.get('/original/:audioId', auth, async (req, res) => {
    try {
        const audio = await audioStorageService.getAudioById(req.params.audioId);
        
        // Check if the audio belongs to the user
        if (audio.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        if (!fs.existsSync(audio.filePath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }
        
        res.sendFile(audio.filePath);
    } catch (error) {
        console.error('Error fetching original audio:', error);
        res.status(500).json({ error: 'Failed to fetch original audio' });
    }
});

module.exports = router;
