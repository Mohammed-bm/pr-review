// src/api/pr.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5000'
    : import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

// Add token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fetch all PRs
export const getPRs = async () => {
  const res = await API.get("/prs");
  return res.data;
};

// Fetch PR diff + analysis
export const getPRDiff = async (prNumber) => {
  const res = await API.get(`/prs/${prNumber}/diff`);
  return res.data;
};
