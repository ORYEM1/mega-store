import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";

import { loginSeller } from "../../../services/sellerApi";
import { useSellerAuthStore } from "../../../store/sellerAuthStore";

import "./SellerLogin.css";

function SellerLogin() {
  const navigate = useNavigate();

  const setAuth = useSellerAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const response = await loginSeller(formData);

      const seller = response.seller;
      const token = response.token;

      if (!seller || !token) {
        throw new Error("Invalid login response from server.");
      }

      setAuth({ seller, token });

      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to log in. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-login-page">
      <div className="seller-login-card">

        <Link to="/" className="seller-login-logo">
          ADRIAN<span> COLLECTIONS</span>
        </Link>

        <div className="seller-login-heading">
          <span className="seller-login-tag">SELLER PORTAL</span>

          <h1>Welcome back</h1>

          <p>
            Sign in to manage your products, inventory and orders.
          </p>
        </div>

        {error && (
          <div className="seller-login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="seller-login-field">
            <label htmlFor="login">Email or phone number</label>

            <div className="seller-login-input-wrapper">
              <FiMail />

              <input
                id="login"
                type="text"
                name="login"
                placeholder="Enter email or phone"
                value={formData.login}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="seller-login-field">
            <label htmlFor="password">Password</label>

            <div className="seller-login-input-wrapper">
              <FiLock />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="seller-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="seller-login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in to Seller Portal"}
          </button>

        </form>

        <div className="seller-login-footer">
          <p>
            Don't have a seller account?{" "}
            <Link to="/seller/register">Apply here</Link>
          </p>

          <Link to="/" className="seller-back-home">
            Back to storefront
          </Link>
        </div>

      </div>
    </div>
  );
}

export default SellerLogin;
