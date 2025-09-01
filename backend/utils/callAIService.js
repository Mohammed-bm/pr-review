const axios = require('axios');

const callAIService = async (repoName, prNumber, diff) => {
  try {
    const response = await axios.post('http://localhost:8000/analyze', {
      repo_name: repoName,
      pr_number: prNumber,
      diff: diff
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calling AI service:', error.message);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

module.exports = callAIService;