const PullRequest = require("../models/PullRequest");
const { fetchDiff } = require("../utils/fetchDiff");
const githubService = require("../services/githubService");
const axios = require("axios");
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// Call AI Service
const callAIService = async (repoName, prNumber, diff) => {
  try {
    console.log(`🤖 Calling AI service for PR #${prNumber}...`);
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      { repo_name: repoName, pr_number: prNumber, diff },
      { timeout: 30000 }
    );
    console.log(`✅ AI analysis completed for PR #${prNumber}`);
    return response.data;
  } catch (err) {
    console.error("❌ AI service error:", err.response?.data || err.message);
    throw new Error(`AI analysis failed: ${err.message}`);
  }
};

// Background processor (runs after webhook is acknowledged)
const processPullRequest = async (payload) => {
  const pr = payload.pull_request;
  const repoName = payload.repository?.full_name;
  const prNumber = pr?.number;

  if (!pr || !repoName || !prNumber) {
    console.error("❌ PR payload missing essential fields");
    return;
  }

  console.log(`📥 Processing PR #${prNumber} from repo ${repoName}`);

  // Step 1: Fetch PR diff
  let diffText;
  try {
    diffText = await fetchDiff(repoName, prNumber);
  } catch (err) {
    console.error(`❌ Failed to fetch diff for PR #${prNumber}:`, err.message);
    return;
  }

  // Step 2: Handle empty diff
  if (!diffText) {
    console.log(`⚠️ PR #${prNumber} has no diff to analyze — skipping AI`);
    await PullRequest.findOneAndUpdate(
      { prNumber, repoName },
      {
        repoName,
        prNumber,
        title: pr.title,
        author: pr.user.login,
        status: pr.state,
        htmlUrl: pr.html_url,
        diffUrl: pr.diff_url,
        diff: diffText,
        action: payload.action,
        analysisStatus: "no_diff",
        analyzedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return;
  }

  // Step 3: Call AI service
  let aiAnalysis;
  try {
    aiAnalysis = await callAIService(repoName, prNumber, diffText);
    console.log("🔹 AI analysis result:", aiAnalysis);
  } catch (err) {
    console.error("⚠️ AI service failed:", err.message);
    await PullRequest.findOneAndUpdate(
      { prNumber, repoName },
      {
        repoName,
        prNumber,
        title: pr.title,
        author: pr.user.login,
        status: pr.state,
        htmlUrl: pr.html_url,
        diffUrl: pr.diff_url,
        diff: diffText,
        action: payload.action,
        analysisStatus: "failed",
        error: err.message,
      },
      { upsert: true, new: true }
    );
    return;
  }

  // Step 4: Save PR with AI results
  await PullRequest.findOneAndUpdate(
    { prNumber, repoName },
    {
      repoName,
      prNumber,
      title: pr.title,
      author: pr.user.login,
      status: pr.state,
      htmlUrl: pr.html_url,
      diffUrl: pr.diff_url,
      diff: diffText,
      action: payload.action,
      score: aiAnalysis.score,
      categories: aiAnalysis.categories,
      summary: aiAnalysis.summary,
      comments: aiAnalysis.comments,
      fixSuggestions: aiAnalysis.fix_suggestions,
      analyzedAt: new Date(),
      analysisStatus: "analyzed",
    },
    { upsert: true, new: true }
  );

  console.log(`💾 Saved PR #${prNumber} analysis to DB`);

  // Step 5: Post review to GitHub
  try {
    console.log(`📤 Posting review to GitHub PR #${prNumber}...`);
    const githubResponse = await githubService.postReviewComment(repoName, prNumber, aiAnalysis);
    console.log("✅ GitHub review posted:", githubResponse.id);

    await PullRequest.findOneAndUpdate(
      { prNumber, repoName },
      {
        githubReviewPosted: true,
        githubReviewPostedAt: new Date(),
        githubReviewId: githubResponse.id,
      }
    );
  } catch (err) {
    console.error("⚠️ Failed to post GitHub review:", err.message);
  }
};

// GitHub Webhook
const githubWebhook = async (req, res) => {
  try {
    const event = req.headers["x-github-event"];
    console.log("👉 Webhook received:", event);

    if (event !== "pull_request") {
      return res.status(200).json({ msg: "Webhook received (not PR)" });
    }

    // ✅ Acknowledge GitHub immediately
    res.status(200).json({ msg: "PR webhook received, processing async" });

    // 🔄 Continue work in background
    processPullRequest(req.body).catch((err) => {
      console.error("❌ Background PR processing failed:", err.message);
    });
  } catch (err) {
    console.error("❌ Unexpected webhook error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { githubWebhook };
