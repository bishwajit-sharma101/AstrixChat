const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

const debug = require('debug')('app:server');

const connectDB = require('./config/db.config');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const { limiter } = require('./middlewares/rateLimit.middleware');
const v1Router = require('./api/v1/index.routes');

// 🔥 ENV VALIDATION
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GEMINI_API_KEY'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ CRITICAL ERROR: Missing ENV variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
debug('Express app initialized.');

connectDB();

// 1. HELMET (Allow Google Popups)
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// 2. CORS (Strict)
const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

// 3. BODY PARSERS
app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ⚡⚡⚡ THE FIX IS HERE ⚡⚡⚡
// We REMOVED "app.use(mongoSanitize())"
// We ADDED this manual middleware instead:
// ⚡ FIX: Comprehensive NoSQL Injection Protection
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// RATE LIMITING

app.use(limiter);
// ⚡ COMPRESSION 
// WARNING: Disabling compression for AI Streaming routes to prevent buffering.
app.use(compression({
  filter: (req, res) => {
    if (req.originalUrl && req.originalUrl.includes('/ai/dolphin/chat')) {
      return false; // Skip compression for streaming
    }
    if (req.headers['x-no-compression']) {
      return false; // Fallback manual trigger
    }
    return compression.filter(req, res);
  }
}));

// --- ROUTES ---
app.get("/speed", (req, res) => res.json({ success: true }));
app.get('/', (req, res) => {
  res.status(200).json({ message: 'AI ChatApp Server is running smoothly!', version: 'v1' });
});

app.use('/api/v1', v1Router);

// ⚡ MEDIA CLEANUP
const fs = require('fs');
const os = require('os');
setInterval(() => {
    const TMP_DIR = path.join(os.tmpdir(), "astrix_audio");
    if (fs.existsSync(TMP_DIR)) {
        fs.readdir(TMP_DIR, (err, files) => {
            if (err) return;
            const now = Date.now();
            for (const file of files) {
                const filePath = path.join(TMP_DIR, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    if (now - stats.mtimeMs > 300000) { 
                        fs.unlink(filePath, () => {});
                    }
                });
            }
        });
    }
}, 600000);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;