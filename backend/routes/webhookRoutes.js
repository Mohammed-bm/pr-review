const express = require("express");
const { githubWebhook } = require("../controllers/webhookController");

const router = express.Router();

router.post("/github", express.json({ type: "*/*" }), githubWebhook);

module.exports = router;
