import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
console.log("API_BASE_URL:", API_BASE_URL);

export const loginWithGoogle = async (idToken) => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/api/auth/google`,
      { idToken },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data; // Returns { token }
  } catch (error) {
    console.error("Google login error:", error.response?.data || error.message);
    throw error;
  }
};