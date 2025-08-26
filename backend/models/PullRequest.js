const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema(
  {
    repoName: { type: String, required: true },
    prNumber: { type: Number, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    status: { type: String, default: "open" }, // open, closed, merged
    action: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    diffUrl: { type: String, required: true },
    diff: { type: String, default: "" },
    
    // AI Analysis Fields (updated to match your AI response)
    score: { type: Number, default: 0 },
    categories: {
      lint: { type: Number, default: 0 },
      bugs: { type: Number, default: 0 },
      security: { type: Number, default: 0 },
      performance: { type: Number, default: 0 }
    },
    summary: { type: String, default: "" },
    comments: [{
      path: String,
      line: Number,
      body: String
    }],
    fixSuggestions: [{
      path: String,
      patch: String
    }],
    analyzedAt: { type: Date },
    analysisStatus: { 
      type: String, 
      enum: ["pending", "analyzed", "failed"], 
      default: "pending" 
    },
    error: { type: String }
  },
  { timestamps: true }
);

// Compound index for faster queries
pullRequestSchema.index({ repoName: 1, prNumber: 1 }, { unique: true });

module.exports = mongoose.model("PullRequest", pullRequestSchema);