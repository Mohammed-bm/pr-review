const axios = require("axios");
const path = require("path");

console.log("Using GitHub token:", process.env.GITHUB_TOKEN ? "Yes" : "No");

class GitHubService {
  constructor() {
    this.baseURL = "https://api.github.com";
    this.token = process.env.GITHUB_TOKEN;
  }

  // Fetch PR files from GitHub
  async getPRFiles(owner, repo, prNumber) {
    const url = `${this.baseURL}/repos/${owner}/${repo}/pulls/${prNumber}/files`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    return response.data;
  }

  // Map AI comments to GitHub PR positions
mapLineToPosition(files, comments) {
  const mapped = [];
  const generalComments = [];

  for (const comment of comments) {
    if (!comment.body) continue;

    let file = files.find(f => f.filename === comment.path);
    if (!file && comment.path) {
      file = files.find(
        f => path.basename(f.filename) === path.basename(comment.path) || f.filename.endsWith(comment.path)
      );
    }

    const filename = file ? file.filename : comment.path || "Unknown file";

    // Force AI to pick a line: if null, use first hunk line
    let lineNumber = comment.line;
    if (lineNumber === null || lineNumber === undefined) {
      if (file && file.patch) {
        const firstHunk = file.patch.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        lineNumber = firstHunk ? parseInt(firstHunk[1], 10) : 1;
      } else {
        lineNumber = null; // fallback to general
      }
    }

    if (lineNumber === null || !file || !file.patch) {
      generalComments.push({
        path: filename,
        body: `📌 [General Comment on ${filename}] ${comment.body}`
      });
      console.log(`⚡ General comment added for ${filename}`);
      continue;
    }

    // Map line to GitHub position
    const diffLines = file.patch.split("\n");
    let position = null;
    let currentLine = 0;

    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      if (line.startsWith("@@")) {
        const match = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
        if (match) currentLine = parseInt(match[1], 10);
        continue;
      }

      if (line.startsWith("+")) {
        if (currentLine === lineNumber) {
          position = i + 1;
          break;
        }
        currentLine++;
      } else if (!line.startsWith("-")) {
        currentLine++;
      }
    }

    if (position) {
      mapped.push({
        path: filename,
        position,
        body: `🤖 **AI Suggestion:** ${comment.body}`
      });
      console.log(`✅ Mapped comment for ${filename} line ${lineNumber} → position ${position}`);
    } else {
      generalComments.push({
        path: filename,
        body: `📌 [General Comment on ${filename}] ${comment.body}`
      });
      console.log(`⚡ General comment (position not found) added for ${filename}`);
    }
  }

  return { inlineComments: mapped, generalComments };
}



  // Post review to GitHub
async postReviewComment(repo, prNumber, reviewData) {
  try {
    const [owner, repoName] = repo.split("/");

    // Determine review event based on score
    let event = "COMMENT";
    if (reviewData.score < 50) event = "REQUEST_CHANGES";
    else if (reviewData.score >= 80) event = "APPROVE";

    // Fetch PR files
    const files = await this.getPRFiles(owner, repoName, prNumber);
    console.log("📄 PR files:", files.map(f => f.filename));

    // Normalize comment paths
const normalizedComments = reviewData.comments.map(comment => {
  let match = files.find(f => f.filename === comment.path);

  // Fallback: if AI gave only the filename, try endsWith
  if (!match) {
    const base = comment.path.split("/").pop(); // get just filename
    match = files.find(f => f.filename.endsWith(base));
  }

  if (match) {
    comment.path = match.filename; // replace with full path
  }

  return comment;
});


    // Map comments to positions with fallback/general comments
    const { inlineComments, generalComments } = this.mapLineToPosition(files, normalizedComments);

    // Include general comments in the main review body
    let reviewBody = this.formatReviewBody(reviewData);
    if (generalComments.length > 0) {
      const generalText = generalComments.map(c => `- ${c.body}`).join("\n");
      reviewBody += `\n\n### ⚡ General Comments:\n${generalText}`;
    }

    // Prepare payload for GitHub API
    const reviewPayload = {
      body: reviewBody,
      event,
      comments: inlineComments,
    };

    // Post review to GitHub
    const response = await axios.post(
      `${this.baseURL}/repos/${owner}/${repoName}/pulls/${prNumber}/reviews`,
      reviewPayload,
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "AI-Code-Reviewer",
        },
      }
    );

    console.log(`✅ Review posted to PR #${prNumber} with event: ${event}`);
    return response.data;

  } catch (error) {
    console.error("❌ Failed to post review to GitHub:", error.response?.data || error.message);
    throw error;
  }
}


  // Format GitHub review body
  formatReviewBody(reviewData) {
    return `## 🤖 AI Code Review Summary

**Overall Score: ${reviewData.score}/100**

${reviewData.summary}

### 📊 Category Scores:
- ✅ **Lint & Style**: ${reviewData.categories.lint}/100
- 🐛 **Bug Detection**: ${reviewData.categories.bugs}/100
- 🔒 **Security**: ${reviewData.categories.security}/100
- ⚡ **Performance**: ${reviewData.categories.performance}/100

*This review was automatically generated by an AI code review system.*`;
  }
}

module.exports = new GitHubService();
