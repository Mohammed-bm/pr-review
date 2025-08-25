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
    diffCached: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PullRequest", pullRequestSchema);
