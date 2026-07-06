import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { loginWithGoogle } from "../api/auth";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    const idToken = credentialResponse.credential;

    try {
      // 1. Pass Google's token to your axios wrapper
      const data = await loginWithGoogle(idToken);
      
      // 2. Persist your custom application session JWT
      localStorage.setItem("token", data.token);
      
      // 3. Route user to the root dashboard
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.msg || "Authentication with your backend server failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    setError("Google Sign-In was canceled or failed to execute.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justify: "center",
        padding: "20px",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
      }}
    >
      <div className="register-container" style={{ textAlign: "center" }}>
        {/* Header */}
        <div className="register-header" style={{ marginBottom: "2rem" }}>
          <h1 className="register-title">Welcome Back</h1>
          <p className="register-subtitle">
            Sign in to your AI Code Review Dashboard
          </p>
        </div>

        {/* Auth Interface Interface Wrapper */}
        <div className="register-form" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          
          {/* Error Message Context Display */}
          {error && <div className="error-box" style={{ width: "100%" }}>{error}</div>}

          {/* Loading Visual Indicator */}
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justify: "center",
                gap: "8px",
                color: "var(--text-secondary, #666)",
              }}
            >
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid transparent",
                  borderTop: "2px solid currentColor",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              Verifying account credentials...
            </div>
          ) : (
            /* Managed Google Login Button Component */
            <div style={{ margin: "10px 0" }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleFailure}
                useOneTap
              />
            </div>
          )}
        </div>
      </div>

      {/* Spinner Keyframe Styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}