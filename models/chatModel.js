const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["ai", "support", "mixed"],
      default: "ai",
    },
    messages: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: {
          type: String,

          required: [true, "Message content is required"],
          maxlength: [2000, "Message cannot exceed 2000 characters"],
        },
        role: {
          type: String,
          enum: ["user", "assistant", "support"],
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Fot Support
    issueType: {
      type: String,
      enum: ["order", "payment", "refund", "general", "other"],
      default: "other",
    },
    // system status (for support)
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
