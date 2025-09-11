// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // in seconds

    if (decoded.exp && decoded.exp < currentTime) {
      // Token expired → remove and redirect
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }
  } catch (err) {
    console.error("Invalid token:", err);
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  return children;
}
