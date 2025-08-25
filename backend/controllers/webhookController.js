const PullRequest = require("../models/PullRequest");

const githubWebhook = async (req, res) => {
  const event = req.headers["x-github-event"];

  // Log only useful info
  console.log("👉 Webhook received!");
  console.log("Event:", event);
  console.log("Action:", req.body.action);
  console.log("Repo:", req.body.repository?.full_name);
  console.log("PR Title:", req.body.pull_request?.title);
  console.log("Author:", req.body.pull_request?.user?.login);
  console.log("Diff URL:", req.body.pull_request?.diff_url);

  // Save PR if it's a pull_request event
  if (event === "pull_request") {
    const pr = req.body.pull_request;

    let diffText = "";
    try {
      diffText = await fetchDiff(req.body.repository.full_name, pr.number);
    } catch (err) {
      console.error("⚠️ Failed to fetch diff for PR", pr.number);
    }

    await PullRequest.findOneAndUpdate(
      { prNumber: pr.number, repoName: req.body.repository.full_name },
      {
        repoName: req.body.repository.full_name,
        prNumber: pr.number,
        title: pr.title,
        author: pr.user.login,
        status: pr.state,
        htmlUrl: pr.html_url,
        diffUrl: pr.diff_url,
        diff: diffText,
        action: req.body.action
      },
      { upsert: true, new: true }
    );
  }

  res.status(200).json({ msg: "Webhook received (no signature check)" });
};

module.exports = { githubWebhook };
