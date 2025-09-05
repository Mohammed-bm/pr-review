// aiPrUpdater.js
const mongoose = require("mongoose");
const axios = require("axios");
const PullRequest = require("./models/PullRequest"); // adjust path if needed
const githubService = require("./services/githubService"); // adjust path if needed
const { fetchDiff } = require("./utils/fetchDiff"); // function to fetch diff from GitHub
require("dotenv").config();

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {});

async function updatePRAnalysis(repoName, prNumber) {
  try {
    // 1. Fetch PR from MongoDB
    const pr = await PullRequest.findOne({ repoName, prNumber });
    if (!pr) {
      console.log(`PR ${prNumber} not found in MongoDB.`);
      return;
    }

    console.log(`Found PR #${prNumber} - ${pr.title}`);

    // 2. Ensure diffCached is present
    if (!pr.diffCached || pr.diffCached.trim().length === 0) {
      console.log("diffCached is empty, fetching latest diff from GitHub...");
      pr.diffCached = await fetchDiff(pr.repoName, pr.prNumber);
      await pr.save();
      console.log("Diff updated in MongoDB.");
    }

    // 3. Send diff to AI service
    let aiResponse;
    try {
      aiResponse = await axios.post("http://localhost:8000/analyze", {
        repo_name: pr.repoName,
        pr_number: pr.prNumber,
        diff: pr.diffCached,
      });
    } catch (err) {
      console.error("AI service call failed:", err.response?.data || err.message);
      return;
    }

    // 4. Update MongoDB with AI results
    pr.analysis = aiResponse.data;
    pr.analysisStatus = "analyzed";
    pr.score = aiResponse.data.score || 0;
    pr.summary = aiResponse.data.summary || "";
    pr.categories = aiResponse.data.categories || {};
    await pr.save();
    console.log("AI analysis saved to MongoDB.");

    // 5. Post AI review back to GitHub (optional)
    if (!pr.githubReviewPosted) {
      await githubService.postReviewComment(pr.repoName, pr.prNumber, pr.analysis);
      pr.githubReviewPosted = true;
      await pr.save();
      console.log("AI review posted to GitHub.");
    }

    console.log("✅ PR analysis update complete.");

  } catch (err) {
    console.error("Error updating PR analysis:", err.message);
  } finally {
    mongoose.disconnect();
  }
}

// Run script for PR #7
updatePRAnalysis("Mohammed-bm/exam-app", 7);
