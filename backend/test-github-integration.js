// backend/test-github-integration.js
require('dotenv').config(); // Load environment variables
const githubService = require('./services/githubService');

const testGitHubIntegration = async () => {
  console.log('🧪 Testing GitHub Integration...');

  // Updated with your new PR info
  const testRepo = 'Mohammed-bm/exam-app';
  const testPRNumber = 9; // Replace with the actual PR number for feature-1

  const testData = {
  score: 75, // < 80 so it becomes a COMMENT instead of APPROVE
  categories: { lint: 85, bugs: 90, security: 75, performance: 80 },
  summary: "Testing AI inline comments for db.js",
  comments: [
    {
      path: "backend/config/db.js",
      line: 9,
      body: "Consider adding a try/catch log context or using a logger library"
    },
    {
      path: "backend/config/db.js",
      line: 11,
      body: "This log is optional; you might want to remove before production"
    }
  ],
  fix_suggestions: []
};

  try {
    console.log(`Testing with repo: ${testRepo}, PR: ${testPRNumber}`);
    const result = await githubService.postReviewComment(
      testRepo, 
      testPRNumber,
      testData
    );

    console.log('✅ GitHub integration test passed!');
    console.log('Review ID:', result.id);
    console.log('Review URL:', result.html_url);
  } catch (error) {
    console.error('❌ GitHub integration test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testGitHubIntegration();
