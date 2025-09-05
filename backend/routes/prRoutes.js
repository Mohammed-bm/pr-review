const express = require("express");
const {
  createPR,
  getPRs,
  getPRDiff,
  getPRDiffAnalysis
} = require("../controllers/prController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new PR entry
router.post("/", protect, createPR);

// Get all PRs
router.get("/", protect, getPRs);

// Get diff + AI analysis by PR number
router.get("/:prNumber/diff", protect, getPRDiff);

// Get AI analysis by DB ID
router.get("/:id/analysis", protect, getPRDiffAnalysis);

module.exports = router;
