AI-Powered MERN Code Reviewer
An automated code review system that analyzes GitHub Pull Requests using AI agents and provides feedback on code quality, bugs, security, and performance.

🌟 Features
Automated PR Reviews: Automatically reviews GitHub Pull Requests via webhooks

Multi-Agent AI Analysis: Uses specialized AI agents for different code quality dimensions

GitHub Integration: Directly posts review comments to PRs

Dashboard: React-based interface to view review history and details

JWT Authentication: Secure access to the review dashboard

🏗️ Architecture
The system consists of three main components:

Node.js Backend: Handles GitHub webhooks, communicates with GitHub API, and serves the React frontend

Python AI Service: Processes code using multiple AI agents for different analysis types

React Frontend: Dashboard for viewing review history and details

Diagram
Code

![Architecture Diagram](images/architecture_img.png)

🛠️ Technology Stack
Backend: Node.js, Express, MongoDB, Mongoose, JWT

AI Service: Python, FastAPI, LangChain, LangGraph

Frontend: React, React Router, Axios

Database: MongoDB

Authentication: JWT with bcrypt password hashing

📁 Project Structure
text
pr-review/
├── backend/                 # Node.js Express server
│   ├── models/             # MongoDB models (User, Review)
│   ├── routes/             # API routes (auth, webhooks, reviews)
│   ├── services/           # GitHub service, AI service client
│   └── middleware/         # Auth, validation, error handling
├── ai-service/             # Python FastAPI service
│   ├── agents/             # AI agents (lint, bug, security, performance)
│   ├── models/             # Pydantic models
│   └── main.py             # FastAPI application
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Main pages (Login, Dashboard, ReviewDetail)
│   │   └── services/      # API calls
│   └── public/
└── docker-compose.yml      # Multi-container setup
🚀 Quick Start
Prerequisites
Node.js (v16 or higher)

Python (v3.8 or higher)

MongoDB (local or Atlas)

GitHub Personal Access Token

OpenAI API key (or other LLM provider)

Installation
Clone the repository

bash
git clone https://github.com/Mohammed-bm/pr-review.git
cd pr-review
Setup Backend

bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
Setup AI Service

bash
cd ../ai-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
Setup Frontend

bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration
Run with Docker (Alternative)

bash
docker-compose up -d
Environment Variables
Backend (.env):

env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pr-review
JWT_SECRET=your_jwt_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_ACCESS_TOKEN=your_github_token
AI_SERVICE_URL=http://localhost:8000
AI Service (.env):

env
OPENAI_API_KEY=your_openai_api_key
Frontend (.env):

env
REACT_APP_API_URL=http://localhost:5000
📋 API Endpoints
Backend API
POST /api/auth/register - User registration

POST /api/auth/login - User login

GET /api/reviews - Get user's reviews (protected)

GET /api/reviews/:id - Get specific review (protected)

POST /webhooks/github - GitHub webhook endpoint

AI Service API
POST /analyze - Analyze code and return review

🔧 Webhook Configuration
Go to your GitHub repository Settings → Webhooks

Add a new webhook with:

Payload URL: https://yourdomain.com/webhooks/github

Content type: application/json

Secret: Your GITHUB_WEBHOOK_SECRET

Events: Select "Pull requests"

🧪 Testing
Backend Tests

bash
cd backend
npm test
AI Service Tests

bash
cd ai-service
pytest
Manual Testing with ngrok

bash
ngrok http 5000
# Use the ngrok URL for webhook testing
📊 Dashboard Usage
Register/Login to the React dashboard

View all your PR reviews with scores and summaries

Click on any review to see detailed feedback including:

Category scores (Lint, Bugs, Security, Performance)

Inline comments with code suggestions

Fix suggestions with patches

🚢 Deployment
Backend Deployment (Railway/Render)
Connect your repository to Railway/Render

Set environment variables

Deploy automatically

AI Service Deployment (Railway/Google Cloud Run)
Connect your AI service directory

Set environment variables

Deploy

Frontend Deployment (Vercel/Netlify)
Connect your frontend directory

Set REACT_APP_API_URL to your deployed backend URL

Deploy

MongoDB Deployment (MongoDB Atlas)
Create a free cluster on MongoDB Atlas

Get connection string

Update MONGODB_URI in your backend environment variables

🤝 Contributing
Fork the repository

Create a feature branch

Commit your changes

Push to the branch

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🆘 Support
If you have any questions or issues, please open an issue on GitHub or contact the maintainers.