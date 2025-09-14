const axios = require('axios');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

const callAIService = async (repoName, prNumber, diff) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
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
