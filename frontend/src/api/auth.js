import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
console.log("API_BASE_URL:", API_BASE_URL);

// Register new user
export const registerUser = async (userData) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("Registration error:", error.response?.data || error.message);
    throw error;
  }
}

// Login user
export const loginUser = async (userData) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, userData, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error;
  }
};
