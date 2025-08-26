const axios = require('axios');
const { githubWebhook } = require('./controllers/webhookController');

const simulateWebhook = async () => {
  console.log('🌐 Simulating GitHub Webhook...\n');

  const mockWebhookData = {
    action: 'opened',
    repository: {
      full_name: 'test/user-repo'
    },
    pull_request: {
      number: 999,
      title: 'Test Feature',
      user: {
        login: 'test-user'
      },
      state: 'open',
      html_url: 'https://github.com/test/user-repo/pull/999',
      diff_url: 'https://github.com/test/user-repo/pull/999.diff'
    }
  };

  const mockRequest = {
    headers: {
      'x-github-event': 'pull_request'
    },
    body: mockWebhookData
  };

  const mockResponse = {
    status: (code) => {
      console.log('📨 Response Status:', code);
      return mockResponse;
    },
    json: (data) => {
      console.log('✅ Webhook Response:', data);
      return mockResponse;
    }
  };

  try {
    await githubWebhook(mockRequest, mockResponse);
    console.log('🎉 Webhook Simulation Successful!');
  } catch (error) {
    console.error('❌ Webhook Test Failed:', error.message);
  }
};

simulateWebhook();