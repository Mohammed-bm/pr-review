import axios from "axios";

const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:5000' 
  : '';

// Register new user
export const registerUser = async (userData) => {
  try {
    console.log("Sending registration request to:", `${API_BASE_URL}/api/auth/register`);
    console.log("Request data:", userData);
    
    const res = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log("Registration successful:", res.data);
    return res.data;
  } catch (error) {
    console.error("Registration error details:");
    console.error("Full error:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    console.error("Error headers:", error.response?.headers);
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.msg || 
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        error.message || 
                        "Registration failed. Please try again.";
    
    throw { msg: errorMessage, details: error.response?.data };
  }
};

// Login user
export const loginUser = async (userData) => {
  try {
    console.log("Sending login request to:", `${API_BASE_URL}/api/auth/login`);
    console.log("Request data:", userData);
    
    const res = await axios.post(`${API_BASE_URL}/api/auth/login`, userData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log("Login successful:", res.data);
    return res.data;
  } catch (error) {
    console.error("Login error details:");
    console.error("Full error:", error);
    console.error("Error response:", error.response?.data);
    
    // Extract meaningful error message
    const errorMessage = error.response?.data?.msg || 
                        error.response?.data?.message ||
                        error.response?.data?.error ||
                        error.message || 
                        "Login failed. Please try again.";
    
    throw { msg: errorMessage, details: error.response?.data };
  }
};

// Get current user profile
export const getProfile = async (token) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return res.data;
  } catch (error) {
    console.error("Get profile error:", error);
    
    const errorMessage = error.response?.data?.msg || 
                        error.response?.data?.message ||
                        error.message || 
                        "Failed to fetch profile";
    
    throw { msg: errorMessage, details: error.response?.data };
  }
};

// Update user profile
export const updateProfile = async (userData, token) => {
  try {
    const res = await axios.put(`${API_BASE_URL}/api/auth/profile`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return res.data;
  } catch (error) {
    console.error("Update profile error:", error);
    
    const errorMessage = error.response?.data?.msg || 
                        error.response?.data?.message ||
                        error.message || 
                        "Failed to update profile";
    
    throw { msg: errorMessage, details: error.response?.data };
  }
};

// Logout user (if your backend has a logout endpoint)
export const logoutUser = async (token) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    return res.data;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even if logout fails on the server, we can still logout locally
    throw { msg: "Logged out locally", details: error.response?.data };
  }
};

export default {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  logoutUser
};