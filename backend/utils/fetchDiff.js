const axios = require("axios");

function ghHeaders(accept = "application/vnd.github.v3+json") {
  const headers = {
    Accept: accept,
    "User-Agent": "next-ai-reviewer"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  } else {
    console.warn("⚠️ GITHUB_TOKEN is missing! GitHub API calls may fail.");
  }

  return headers;
}

const fetchDiff = async (repoName, prNumber) => {
  try {
    console.log(`🔹 Fetching PR #${prNumber} details for repo: ${repoName}`);

    const apiUrl = `https://api.github.com/repos/${repoName}/pulls/${prNumber}`;

    // Step 1: Get PR metadata
    let meta;
    try {
      const metaRes = await axios.get(apiUrl, { headers: ghHeaders() });
      meta = metaRes.data;
      console.log("✅ PR metadata fetched:", meta.title);
    } catch (err) {
      console.error("❌ Failed to fetch PR metadata", err.response?.data || err.message);
      throw new Error("Failed to fetch PR metadata");
    }

    const diffUrl = meta.diff_url;
    console.log("🔹 Diff URL from API:", diffUrl);

    // Step 2: Try canonical .diff
    let directDiff = "";
    try {
      const diffRes = await axios.get(diffUrl, {
        headers: ghHeaders("application/vnd.github.v3.diff"),
      });
      directDiff = (diffRes.data || "").trim();
      if (directDiff.length > 0) {
        console.log("✅ Direct diff fetched, length:", directDiff.length);
        return directDiff;
      }
      console.warn("⚠️ Direct diff is empty — may be a merge commit or binary changes");
    } catch (err) {
      console.error("❌ Failed to fetch direct diff", err.response?.data || err.message);
    }

    // Step 3: Fallback to /files API
    let files;
    try {
      const filesRes = await axios.get(`${apiUrl}/files`, {
        headers: ghHeaders(),
      });
      files = filesRes.data || [];
      console.log(`🔹 /files API fetched ${files.length} files`);
    } catch (err) {
      console.error("❌ Failed to fetch PR files via /files API", err.response?.data || err.message);
      throw new Error("Failed to fetch PR files");
    }

    let combinedDiff = "";
    for (const f of files) {
      combinedDiff += `diff --git a/${f.filename} b/${f.filename}\n`;
      if (f.patch) combinedDiff += f.patch + "\n";
    }

    if (!combinedDiff) {
      console.warn("⚠️ Combined diff is empty — skipping AI analysis");
      return ""; // return empty string instead of throwing
    }

    console.log("✅ Combined diff length:", combinedDiff.trim().length);
    return combinedDiff;

  } catch (err) {
    console.error("❌ fetchDiff final error:", err.message);
    throw err;
  }
};

module.exports = { fetchDiff };
