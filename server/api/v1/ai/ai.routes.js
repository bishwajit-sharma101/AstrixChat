// api/v1/ai/ai.routes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const os = require("os");
const fs = require("fs");

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
const upload = multer({ storage });

// Upload raw audio
router.post("/upload_audio", upload.single("audio"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  return res.json({ filename: req.file.filename });
});

// Serve raw
router.get("/raw/:filename", (req, res) => {
  const filePath = path.join(TMP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Not found" });
  res.sendFile(filePath);
});

module.exports = router;
