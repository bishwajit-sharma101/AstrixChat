const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // UPDATED: Structured content for multi-language support
    content: {
      original: {
        type: String,
        required: true,
        trim: true
      },
      // Map of language codes to translated strings
      // e.g., { "hi": "नमस्ते", "es": "Hola" }
      translations: {
        type: Map,
        of: String,
        default: {}
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);