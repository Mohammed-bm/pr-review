const express = require("express");
const { createPR, getPRs, getPRDiff } = require("../controllers/prController");
const { protect } = require("../middleware/authMiddleware");
const { getPRDiffAnalysis } = require("../controllers/prController");

const router = express.Router();

router.post("/", protect, createPR);
router.get("/", protect, getPRs);
// use prNumber instead of _id
router.get("/:prNumber/diff", protect, getPRDiff);
router.get("/:id/diff", getPRDiffAnalysis);

module.exports = router;
