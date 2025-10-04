const PullRequest = require("../models/PullRequest");
const { fetchDiff } = require("../utils/fetchDiff");
const githubService = require("../services/githubService");
const axios = require("axios");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// @desc    Create a new PR entry (triggered by webhook or manual call)
// @route   POST /api/prs
// @access  Protected
const createPR = async (req, res, next) => {
  try {
    const { repoName, prNumber, title, author } = req.body;

    // Validate required fields
    if (!repoName || !prNumber) {
      return res.status(400).json({ error: "repoName and prNumber are required" });
    }

    // 1. Fetch PR details from GitHub
    let prDetails = {};
    try {
      prDetails = await githubService.getPRDetails(repoName, prNumber);
    } catch (err) {
      console.error("⚠️ Could not fetch PR details from GitHub:", err.message);
      // Fallback defaults if API fails
      prDetails = {
        title,
        user: { login: author },
        state: "open",
        diff_url: `https://github.com/${repoName}/pull/${prNumber}.diff`,
        html_url: `https://github.com/${repoName}/pull/${prNumber}`,
      };
    }

    // 2. Create PR entry in DB with required fields
    const pr = await PullRequest.create({
      repoName,
      prNumber,
      title: prDetails.title || title,
      author: prDetails.user?.login || author,
      status: prDetails.state || "open",
      diffUrl: prDetails.diff_url,   // ✅ required
      htmlUrl: prDetails.html_url,   // ✅ required
      action: "opened",              // ✅ required (adjust with webhook if needed)
    });

    // 3. Fetch actual diff from GitHub
    let diffText = "";
    try {
      diffText = await fetchDiff(repoName, prNumber);
      pr.diffCached = diffText;
    } catch (diffErr) {
      console.error("⚠️ Could not fetch diff:", diffErr.message);
    }

    // 4. Send diff to AI service
    let analysis = null;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
        repo_name: repoName,
        pr_number: prNumber,
        diff: diffText,
      });
      analysis = response.data;
      pr.analysis = analysis;
      pr.analysisStatus = "analyzed";
    } catch (aiError) {
      console.error("⚠️ AI Service Error:", aiError.message);
    }

    // 5. Save PR + AI results in MongoDB
    await pr.save();

    // 6. Post AI review back to GitHub
    try {
      if (analysis) {
        await githubService.postReviewComment(repoName, prNumber, analysis);
      }
    } catch (ghError) {
      console.error("⚠️ GitHub review post failed:", ghError.message);
    }

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

// @desc    Get diff + AI analysis for a PR
// @route   GET /api/prs/:prNumber/diff
// @access  Protected
const getPRDiff = async (req, res, next) => {
  try {
    const pr = await PullRequest.findOne({ prNumber: req.params.prNumber });

    if (!pr) {
      return res.status(404).json({ error: "PR not found" });
    }

    // ✅ 1. Use cached diff if available, otherwise fetch from GitHub
    const diffText = pr.diff || (await fetchDiff(pr.repoName, pr.prNumber));

    if (!diffText || diffText.trim().length === 0) {
      return res.json({
        diff: null,
        message: "ℹ️ This PR has no file changes.",
      });
    }

    // ✅ 2. Check if AI analysis already exists in DB
    if (pr.analysisStatus === "analyzed" && pr.summary && pr.score) {
      console.log(`✅ Returning cached analysis for PR #${pr.prNumber}`);
      return res.json({
        prNumber: pr.prNumber,
        repoName: pr.repoName,
        diff: diffText,
        analysis: {
          score: pr.score,
          categories: pr.categories,
          summary: pr.summary,
          comments: pr.comments,
          fixSuggestions: pr.fixSuggestions
        },
        cached: true
      });
    }

    // ✅ 3. Only call AI if no previous analysis exists
    console.log(`🤖 No existing analysis for PR #${pr.prNumber}, calling AI...`);
    let aiAnalysis = null;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, {
        repo_name: pr.repoName,
        pr_number: pr.prNumber,
        diff: diffText,
      });

      aiAnalysis = aiResponse.data;

      // ✅ 4. Save new analysis to DB
      pr.diff = diffText;
      pr.score = aiAnalysis.score;
      pr.categories = aiAnalysis.categories;
      pr.summary = aiAnalysis.summary;
      pr.comments = aiAnalysis.comments;
      pr.fixSuggestions = aiAnalysis.fix_suggestions;
      pr.analysisStatus = "analyzed";
      pr.analyzedAt = new Date();

      await pr.save();

    } catch (error) {
      console.error("❌ AI service call failed:", error.message);
      return res.status(500).json({ error: "AI analysis failed" });
    }

    res.json({
      prNumber: pr.prNumber,
      repoName: pr.repoName,
      diff: diffText,
      analysis: aiAnalysis,
      cached: false
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get AI analysis by DB ID
// @route   GET /api/prs/:id/analysis
// @access  Protected
const getPRDiffAnalysis = async (req, res, next) => {
  try {
    const pr = await PullRequest.findById(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: "PR not found" });
    }

    res.json({
      prNumber: pr.prNumber,
      repoName: pr.repoName,
      analysis: pr.analysis || null,
    });
  } catch (err) {
    next(err);
  }
};


module.exports = { createPR, getPRs, getPRDiff, getPRDiffAnalysis};
