const PullRequest = require("../models/PullRequest");
const axios = require('axios');
const fetchDiff = require("../utils/fetchDiff"); // Make sure this is imported

// Function to call AI service
const callAIService = async (repoName, prNumber, diff) => {
  try {
    console.log(`🤖 Calling AI service for PR #${prNumber}...`);
    
    const response = await axios.post('http://localhost:8000/analyze', {
      repo_name: repoName,
      pr_number: prNumber,
      diff: diff
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    console.log(`✅ AI analysis completed for PR #${prNumber}`);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error calling AI service:', error.message);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

const githubWebhook = async (req, res) => {
  const event = req.headers["x-github-event"];

  // Log only useful info
  console.log("👉 Webhook received!");
  console.log("Event:", event);
  console.log("Action:", req.body.action);
  console.log("Repo:", req.body.repository?.full_name);
  console.log("PR Title:", req.body.pull_request?.title);
  console.log("Author:", req.body.pull_request?.user?.login);

  // Save PR if it's a pull_request event
  if (event === "pull_request") {
    const pr = req.body.pull_request;
    const repoName = req.body.repository.full_name;
    const prNumber = pr.number;

    let diffText = "";
    try {
      console.log(`📥 Fetching diff for PR #${prNumber}...`);
      diffText = await fetchDiff(repoName, prNumber);
    } catch (err) {
      console.error("⚠️ Failed to fetch diff for PR", prNumber);
      return res.status(500).json({ error: "Failed to fetch diff" });
    }

    try {
      // Call AI service for analysis
      console.log(`🔍 Analyzing PR #${prNumber} with AI...`);
      const aiAnalysis = await callAIService(repoName, prNumber, diffText);
      
      // Save to database with AI results
      const savedPR = await PullRequest.findOneAndUpdate(
        { prNumber: prNumber, repoName: repoName },
        {
          repoName: repoName,
          prNumber: prNumber,
          title: pr.title,
          author: pr.user.login,
          status: pr.state,
          htmlUrl: pr.html_url,
          diffUrl: pr.diff_url,
          diff: diffText,
          action: req.body.action,
          // AI Analysis Results
          score: aiAnalysis.score,
          categories: aiAnalysis.categories,
          summary: aiAnalysis.summary,
          comments: aiAnalysis.comments,
          fixSuggestions: aiAnalysis.fix_suggestions,
          analyzedAt: new Date(),
          status: 'analyzed'
        },
        { upsert: true, new: true }
      );

      console.log(`💾 Saved AI analysis for PR #${prNumber}`);
      console.log(`📊 Score: ${aiAnalysis.score}`);
      console.log(`📝 Summary: ${aiAnalysis.summary}`);

      res.status(200).json({ 
        message: 'PR analyzed and saved successfully', 
        data: aiAnalysis 
      });

    } catch (error) {
      console.error('❌ Error in AI analysis or saving:', error.message);
      
      // Save without AI results if analysis failed
      await PullRequest.findOneAndUpdate(
        { prNumber: prNumber, repoName: repoName },
        {
          repoName: repoName,
          prNumber: prNumber,
          title: pr.title,
          author: pr.user.login,
          status: pr.state, // PR status from GitHub
          htmlUrl: pr.html_url,
          diffUrl: pr.diff_url,
          diff: diffText,
          action: req.body.action,
          // AI Analysis Results:
          score: aiAnalysis.score,
          categories: aiAnalysis.categories,
          summary: aiAnalysis.summary,
          comments: aiAnalysis.comments,
          fixSuggestions: aiAnalysis.fix_suggestions,
          analyzedAt: new Date(),
          analysisStatus: 'analyzed' // Use analysisStatus, not status
        },
        { upsert: true, new: true }
      );

      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(200).json({ msg: "Webhook received (not a PR event)" });
  }
};

module.exports = { githubWebhook };