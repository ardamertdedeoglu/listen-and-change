const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const speechService = require('../services/speechService');
const audioService = require('../services/audioService');
const nlpService = require('../services/nlpService');

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

// Upload audio file
router.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        console.log(`📁 New file uploaded: ${req.file.filename}`);
        
        // Clean up old uploads AFTER the new file is saved
        // This prevents conflicts and ensures the new file isn't deleted
        setTimeout(() => {
            const uploadsDir = path.join(__dirname, '../uploads');
            try {
                const files = fs.readdirSync(uploadsDir);
                const currentFile = req.file.filename;
                
                files.forEach(file => {
                    if (file !== currentFile && !file.startsWith('.')) {
                        const filePath = path.join(uploadsDir, file);
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`  🗑️ Cleaned up old file: ${file}`);
                        } catch (error) {
                            console.error(`  ❌ Failed to delete ${file}:`, error.message);
                        }
                    }
                });
            } catch (error) {
                console.error('❌ Error during cleanup:', error);
            }
        }, 1000); // Wait 1 second to ensure file is saved
        
        const audioFile = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        };

        res.json({
            message: 'Audio file uploaded successfully',
            file: audioFile
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload audio file' });
    }
});

// Convert speech to text
router.post('/speech-to-text', async (req, res) => {
    try {
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const audioPath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }

        const transcription = await speechService.transcribeAudio(audioPath);
        
        res.json({
            transcription: transcription,
            words: transcription.words || []
        });
    } catch (error) {
        console.error('Speech-to-text error:', error);
        res.status(500).json({ error: 'Failed to transcribe audio' });
    }
});

// Analyze text and identify words to replace
router.post('/analyze-text', async (req, res) => {
    try {
        const { text, targetWords } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const analysis = await nlpService.analyzeText(text, targetWords);
        
        res.json({
            analysis: analysis,
            wordsFound: analysis.wordsFound || [],
            suggestions: analysis.suggestions || []
        });
    } catch (error) {
        console.error('Text analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze text' });
    }
});

// Process audio with word replacements
router.post('/process-audio', async (req, res) => {
    try {
        // Clean up old processed files to save space
        cleanupOldProcessedFiles();
        
        const { filename, replacements } = req.body;
        
        if (!filename || !replacements) {
            return res.status(400).json({ error: 'Filename and replacements are required' });
        }

        const audioPath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }

        // Validate replacements to ensure they have valid timestamps
        const validReplacements = replacements.filter(r => 
            r.startTime !== undefined && 
            r.endTime !== undefined && 
            r.startTime < r.endTime && 
            r.replacementText
        );
        
        if (validReplacements.length === 0) {
            console.log('No valid replacements found, returning original file');
            return res.json({
                message: 'No valid replacements found, using original file',
                processedFile: filename,
                downloadUrl: `/api/audio/download/${filename}`
            });
        }

        console.log(`Processing audio with ${validReplacements.length} valid replacements`);
        
        const processedAudio = await audioService.processAudioReplacements(audioPath, validReplacements);
        
        if (!processedAudio || !processedAudio.filename) {
            throw new Error('Audio processing failed to return a valid file');
        }
        
        // Verify the processed file exists
        const processedPath = path.join(__dirname, '../uploads', processedAudio.filename);
        if (!fs.existsSync(processedPath)) {
            throw new Error('Processed file was not created');
        }
        
        res.json({
            message: 'Audio processed successfully',
            processedFile: processedAudio.filename,
            downloadUrl: `/api/audio/download/${processedAudio.filename}`
        });
    } catch (error) {
        console.error('Audio processing error:', error);
        res.status(500).json({ error: 'Failed to process audio: ' + error.message });
    }
});

// Download processed audio
router.get('/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const audioPath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set appropriate headers for audio download
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'audio/wav');
        
        // Create a read stream and pipe it to the response
        const fileStream = fs.createReadStream(audioPath);
        
        // Handle errors on the file stream
        fileStream.on('error', (err) => {
            console.error('File stream error:', err);
            // Only send error response if headers haven't been sent yet
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to stream file' });
            }
        });
        
        // Handle client disconnect
        req.on('close', () => {
            fileStream.destroy();
        });
        
        // Pipe the file to the response
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Download error:', error);
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to download file' });
        }
    }
});

// Get audio file info
router.get('/info/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const audioPath = path.join(__dirname, '../uploads', filename);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stats = fs.statSync(audioPath);
        
        res.json({
            filename: filename,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
        });
    } catch (error) {
        console.error('File info error:', error);
        res.status(500).json({ error: 'Failed to get file info' });
    }
});

module.exports = router;
