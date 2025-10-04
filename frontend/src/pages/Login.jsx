import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser(formData);
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
      }}
    >
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <h1 className="register-title">Welcome Back</h1>
          <p className="register-subtitle">
            Sign in to your AI Code Review Dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Email Field */}
          <div className="reg-form-group">
            <label className="reg-form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="reg-form-input"
            />
            <span className="input-icon">✉️</span>
          </div>

          {/* Password Field */}
          <div className="reg-form-group">
            <label className="reg-form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="reg-form-input"
            />
            <span className="input-icon">🔒</span>
          </div>

          {/* Demo Hint */}
          <div className="demo-box">
            <strong>Demo:</strong> test@example.com / password123
          </div>

          {/* Error Message */}
          {error && <div className="error-box">{error}</div>}

          {/* Login Button */}
          <button type="submit" className="register-button" disabled={loading}>
            {loading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTop: "2px solid white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                Signing in...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p className="register-footer-text">
            Don’t have an account?{" "}
            <Link to="/register" className="login-link">
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Spinner Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
