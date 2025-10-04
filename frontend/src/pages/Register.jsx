import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    
    try {
      const data = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Password requirement checks
  const hasMinLength = formData.password.length >= 6;
  const hasNumber = /\d/.test(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <h1 className="register-title">Create an Account</h1>
          <p className="register-subtitle">
            Join CodeSage for AI-powered code reviews and developer insights
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Username Field */}
          <div className="reg-form-group">
            <label className="reg-form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              className="reg-form-input"
            />
            <span className="input-icon">👤</span>
          </div>

          {/* Email Field */}
          <div className="reg-form-group">
            <label className="reg-form-label">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
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
              placeholder="Create a password"
              required
              className="reg-form-input"
            />
            <span className="input-icon">🔒</span>
            
            {/* Password Requirements */}
            {formData.password && (
              <div className="password-requirements">
                <div className={`requirement ${hasMinLength ? 'met' : 'unmet'}`}>
                  {hasMinLength ? '✓' : '○'} At least 6 characters
                </div>
                <div className={`requirement ${hasNumber ? 'met' : 'unmet'}`}>
                  {hasNumber ? '✓' : '○'} Contains a number
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="reg-form-group">
            <label className="reg-form-label">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className="reg-form-input"
            />
            <span className="input-icon">🔒</span>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div style={{
                fontSize: '12px',
                marginTop: '4px',
                color: passwordsMatch ? '#3fb950' : '#f85149'
              }}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#da3633',
              color: '#f0f6fc',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '14px',
              textAlign: 'center',
              border: '1px solid #f85149'
            }}>
              {error}
            </div>
          )}

          {/* Register Button */}
          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating Account...
              </div>
            ) : (
              'Register'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="register-footer">
          <p className="register-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* Add spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}