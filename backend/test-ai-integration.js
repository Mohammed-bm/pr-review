const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Require model at the top so it's accessible to all functions
const PullRequest = require('./models/PullRequest');

// Connect to test DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/code-reviewer-test');

/**
 * Executes a series of tests to verify the core integration between the Node.js
 * backend, the Python AI service, and the MongoDB database.
 */
const testAIIntegration = async () => {
  console.log('🧪 Testing Node.js → Python Integration...\n');

  const testDiff = `diff --git a/src/app.js b/src/app.js
index a1b2c3d..e4f5g6h 100644
--- a/src/app.js
+++ b/src/app.js
@@ -5,6 +5,10 @@ app.get('/', (req, res) => {
   res.send('Hello World!');
 });

+app.get('/users', (req, res) => {
+  res.json({ users: [] });
+});
+
 app.listen(3000, () => {
   console.log('Server running on port 3000');
 });`;

  try {
    // Test 1: Call AI service directly
    console.log('1. 📞 Calling AI Service...');
    const aiResponse = await axios.post('http://localhost:8000/analyze', {
      repo_name: 'test/user-repo',
      pr_number: 123,
      diff: testDiff
    });

    console.log('✅ AI Service Response:');
    console.log('   Score:', aiResponse.data.score);
    console.log('   Summary:', aiResponse.data.summary);
    console.log('   Categories:', JSON.stringify(aiResponse.data.categories, null, 2));

    // Test 2: Test with your actual webhook controller function
    console.log('\n2. 🧪 Testing Webhook Controller Logic...');
    
    const mockData = {
      score: aiResponse.data.score,
      categories: aiResponse.data.categories,
      summary: aiResponse.data.summary,
      comments: aiResponse.data.comments || [],
      fix_suggestions: aiResponse.data.fix_suggestions || []
    };

    // Test database save
    const savedPR = await PullRequest.findOneAndUpdate(
      { prNumber: 123, repoName: 'test/user-repo' },
      {
        repoName: 'test/user-repo',
        prNumber: 123,
        title: 'Test PR',
        author: 'test-user',
        status: 'open',
        htmlUrl: 'https://github.com/test/user-repo/pull/123',
        diffUrl: 'https://github.com/test/user-repo/pull/123.diff',
        diff: diffTest,
        action: 'opened',
        score: mockData.score,
        categories: mockData.categories,
        summary: mockData.summary,
        comments: mockData.comments,
        fixSuggestions: mockData.fix_suggestions,
        analyzedAt: new Date(),
        analysisStatus: 'analyzed'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Database Save Successful!');
    console.log('   Saved PR ID:', savedPR._id);
    console.log('   Analysis Status:', savedPR.analysisStatus);

    // Test 3: Verify data retrieval
    console.log('\n3. 📊 Verifying Data Retrieval...');
    const retrievedPR = await PullRequest.findOne({ prNumber: 123 });
    console.log('✅ Data Retrieval Successful!');
    console.log('   Retrieved Score:', retrievedPR.score);
    console.log('   Retrieved Summary:', retrievedPR.summary);

    // Now, run the error handling tests
    await testErrorHandling();

    console.log('\n🎉 ALL TESTS PASSED! Integration is working!');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.response) {
      console.error('   AI Service Error:', error.response.data);
    }
  } finally {
    // Always close the database connection
    await mongoose.connection.close();
  }
};

/**
 * Tests various error scenarios to ensure graceful failure.
 */
const testErrorHandling = async () => {
  console.log('\n4. 🚨 Testing Error Handling...');
  
  // Test with invalid AI service URL (should result in a connection error/timeout)
  try {
    await axios.post('http://localhost:9999/analyze', {
      repo_name: 'test/repo',
      pr_number: 1,
      diff: 'test'
    }, { timeout: 1000 });
  } catch (error) {
    // The code should be 'ECONNREFUSED' or a similar timeout/network error
    console.log('✅ Timeout Error Handling:', error.code || error.message);
  }

  // Test database error handling with an invalid field
  try {
    // This will likely throw a Mongoose validation error
    await PullRequest.findOneAndUpdate(
      { prNumber: 999 },
      { $set: { invalidField: "test" } }
    );
  } catch (dbError) {
    console.log('✅ Database Error Handling:', dbError.message);
  }
};

// Run the full test suite if this file is executed directly
if (require.main === module) {
  testAIIntegration();
}

module.exports = { testAIIntegration, testErrorHandling };
