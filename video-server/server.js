const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.VIDEO_SERVER_PORT || process.env.PORT || 8080;
const VIDEOS_DIR = path.join(__dirname, 'videos');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Ensure videos directory exists
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// List available videos
app.get('/api/videos', (req, res) => {
  try {
    const files = fs.readdirSync(VIDEOS_DIR);
    const videos = files
      .filter(file => /\.(mp4|webm|ogg)$/i.test(file))
      .map(file => ({
        id: file,
        name: file.replace(/\.[^/.]+$/, ''),
        filename: file,
        size: fs.statSync(path.join(VIDEOS_DIR, file)).size,
        createdAt: fs.statSync(path.join(VIDEOS_DIR, file)).birthtime
      }));
    
    res.json(videos);
  } catch (error) {
    console.error('Error listing videos:', error);
    res.status(500).json({ error: 'Failed to list videos' });
  }
});

// Stream video
app.get('/api/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(VIDEOS_DIR, filename);

  // Security check - prevent directory traversal
  if (!fs.existsSync(videoPath) || path.dirname(videoPath) !== VIDEOS_DIR) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Upload video (protected endpoint - should be behind auth in production)
app.post('/api/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    
    res.json({
      message: 'Video uploaded successfully',
      filename: req.file.filename,
      size: req.file.size,
      path: `/api/video/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Video streaming server running on port ${PORT}`);
  console.log(`Videos directory: ${VIDEOS_DIR}`);
});
