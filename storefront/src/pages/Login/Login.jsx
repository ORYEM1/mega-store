import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaLock,
  FaEnvelope,
  FaExclamationCircle,
} from "react-icons/fa";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionMessage =
    location.state?.message ||
    sessionStorage.getItem("auth_message");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/login", formData);

      const { token, customer } = response.data;

      if (!token || !customer) {
        throw new Error(
          "The login response did not contain a token and customer."
        );
      }

      setAuth({
        token,
        customer,
      });

      sessionStorage.removeItem("auth_message");

      const destination = location.state?.from;

      navigate(destination?.pathname || "/", {
        replace: true,
      });
    } catch (error) {
      if (error.response?.status === 422) {
        const errors = error.response.data.errors;

        setError(
          errors?.login?.[0] ||
            errors?.password?.[0] ||
            error.response.data.message ||
            "Invalid login details."
        );
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Unable to log in. Check your connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-decoration">
        <span className="auth-decoration-text">MEGA STORE</span>
        <div className="auth-decoration-content">
          <p className="auth-eyebrow">YOUR STYLE. YOUR RULES.</p>
          <h2>
            WEAR
            <br />
            YOUR
            <br />
            <span>IDENTITY.</span>
          </h2>
          <p>Discover pieces that make a statement.</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-form-wrapper">
          <Link to="/" className="auth-logo">
            MEGA STORE COLLECTION<span>.</span>
          </Link>

          <div className="auth-heading">
            <p className="auth-eyebrow">WELCOME BACK</p>
            <h1>LOG IN.</h1>
            <p>Sign in to continue shopping with Adrian Collections.</p>
          </div>

          {sessionMessage && (
            <div className="auth-message session-message" role="status">
              {sessionMessage}
            </div>
          )}

          {error && (
            <div className="auth-message error-message" role="alert">
              <FaExclamationCircle />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <label htmlFor="login">EMAIL OR PHONE NUMBER</label>

              <div className="auth-input-wrapper">
                <FaEnvelope />

                <input
                  id="login"
                  name="login"
                  type="text"
                  value={formData.login}
                  onChange={handleChange}
                  placeholder="Enter email or phone number"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">PASSWORD</label>

              <div className="auth-input-wrapper">
                <FaLock />

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? (
                "LOGGING IN..."
              ) : (
                <>
                  LOG IN <FaArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register">Create an account</Link>
            </p>

            <Link to="/" className="auth-back-link">
              Back to shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;