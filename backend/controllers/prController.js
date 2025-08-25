const PullRequest = require("../models/PullRequest");
const { fetchDiff } = require("../utils/fetchDiff");
const axios = require("axios");

// @desc    Create a new PR entry
// @route   POST /api/prs
// @access  Protected
const createPR = async (req, res, next) => {
  try {
    const { repoName, prNumber, title, author } = req.body;

    const pr = await PullRequest.create({
      repoName,
      prNumber,
      title,
      author,
    });

    res.status(201).json(pr);
  } catch (err) {
    next(err);
  }
};

// @desc    Get all PRs
// @route   GET /api/prs
// @access  Protected
const getPRs = async (req, res, next) => {
  try {
    const prs = await PullRequest.find();
    res.json(prs);
  } catch (err) {
    next(err);
  }
};

// @desc    Get diff for a specific PR by prNumber + analyze with AI service
// @route   GET /api/prs/:prNumber/diff
// @access  Protected
const getPRDiff = async (req, res, next) => {
  try {
    const pr = await PullRequest.findOne({ prNumber: req.params.prNumber });
    if (!pr) {
      return res.status(404).json({ error: "PR not found" });
    }

    const diffText = pr.diffCached || await fetchDiff(pr.repoName, pr.prNumber);

    if (!diffText || diffText.trim().length === 0) {
      return res.json({
        diff: null,
        message: "ℹ️ This PR has no file changes."
      });
    }

    // Call AI Service with proper payload
    let aiAnalysis = null;
    try {
      const aiResponse = await axios.post("http://localhost:8000/analyze", {
        repo_name: pr.repoName,
        pr_number: pr.prNumber,
        diff: diffText,
      });
      aiAnalysis = aiResponse.data;
    } catch (error) {
      console.error("❌ AI service call failed:", error.message);
      aiAnalysis = { error: "AI service unavailable" };
    }

    // Save diff in MongoDB
    pr.diffCached = diffText;
    await pr.save();

    // ✅ Return both diff + AI analysis
    res.json({
      prNumber: pr.prNumber,
      repoName: pr.repoName,
      diff: diffText,
      analysis: aiAnalysis,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPR, getPRs, getPRDiff };
