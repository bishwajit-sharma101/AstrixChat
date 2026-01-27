const express = require('express');
const router = express.Router();

router.use("/translate_text", require("./ai/gemini.routes"));
router.use("/translate_text", require("./ai/local_translation.routes"));
module.exports = router;