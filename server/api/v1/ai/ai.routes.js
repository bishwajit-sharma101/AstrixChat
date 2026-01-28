const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { protect } = require("../../../modules/auth/auth.middleware");
const { limiter } = require("../../../middlewares/rateLimit.middleware");

// temp folder
const TMP_DIR = path.join(os.tmpdir(), "astrix_audio");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TMP_DIR),
  filename: (req, file, cb) => {
    const uniq = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    cb(null, `raw_${uniq}${path.extname(file.originalname) || ".webm"}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB Limit
  fileFilter: (req, file, cb) => {
     if (file.mimetype.startsWith('audio/')) cb(null, true);
     else cb(new Error('Only audio files allowed'), false);
  }
});

// Upload raw audio
router.post("/upload_audio", protect, limiter, upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  return res.json({ filename: req.file.filename });
});

// Serve raw
router.get("/raw/:filename", (req, res) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  
  // ⚡ FIX 3: Stream-based response (Better for memory)
  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);

  // Optional: Delete after sending (Aggressive Cleanup)
  // Uncomment this if you want truly ephemeral storage
  /*
  readStream.on('end', () => {
      fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting temp file:", err);
      });
  });
  */
});

// Import specific routes
const geminiRoutes = require("./gemini.routes");
const localRoutes = require("./local_translation.routes");

// Apply middleware
router.use("/translate_text", protect, limiter, geminiRoutes);
router.use("/translate_text", protect, limiter, localRoutes);

module.exports = router;