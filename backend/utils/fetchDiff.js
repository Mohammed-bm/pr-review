const axios = require("axios");

function ghHeaders(accept = "application/vnd.github.v3+json") {
  const headers = {
    Accept: accept,
    "User-Agent": "next-ai-reviewer"
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

const fetchDiff = async (repoName, prNumber) => {
  try {
    console.log("Fetching PR details for:", repoName, prNumber);

    const apiUrl = `https://api.github.com/repos/${repoName}/pulls/${prNumber}`;

    // Get PR metadata
    const { data: meta } = await axios.get(apiUrl, {
      headers: ghHeaders()
    });

    const diffUrl = meta.diff_url;
    console.log("Diff URL from API:", diffUrl);

    // Try canonical .diff
    const diffRes = await axios.get(diffUrl, {
      headers: ghHeaders("application/vnd.github.v3.diff")
    });

    const directDiff = (diffRes.data || "").trim();

    if (directDiff.length > 0) {
      console.log("✅ Direct diff length:", directDiff.length);
      return directDiff;
    }

    console.warn("⚠️ Direct diff empty — trying /files fallback");

    // Fallback: use /files API and stitch patches
    const filesRes = await axios.get(`${apiUrl}/files`, {
      headers: ghHeaders()
    });

    const files = filesRes.data || [];
    let combined = "";

    for (const f of files) {
      combined += `diff --git a/${f.filename} b/${f.filename}\n`;
      if (f.patch) combined += f.patch + "\n";
    }

    console.log("✅ Fallback diff length:", combined.trim().length);
    return combined;
  } catch (error) {
    console.error("❌ Failed to fetch diff:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return "";
  }
};

module.exports = { fetchDiff };
