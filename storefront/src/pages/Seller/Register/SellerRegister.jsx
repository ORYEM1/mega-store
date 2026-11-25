import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiBriefcase,
  FiMapPin,
} from "react-icons/fi";

import { registerSeller } from "../../../services/sellerApi";

import "./SellerRegister.css";

function SellerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
    password: "",
    business_name: "",
    business_description: "",
    address: "",
    city: "",
    state: "",
    country: "Uganda",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
    setLoading(true);

    try {
      const response = await registerSeller(formData);

      setSuccess(
        response.message ||
          "Your seller application has been submitted successfully."
      );

      // Clear the form after successful submission.
      setFormData({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        phone: "",
        password: "",
        business_name: "",
        business_description: "",
        address: "",
        city: "",
        state: "",
        country: "Uganda",
      });
    } catch (err) {
      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        const firstError = Object.values(validationErrors).flat()[0];
        setError(firstError || "Please check your registration details.");
      } else {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="seller-register-page">
        <div className="seller-register-card seller-register-success">
          <div className="seller-success-icon">✓</div>

          <span className="seller-register-tag">APPLICATION RECEIVED</span>

          <h1>Thank you for applying!</h1>

          <p>{success}</p>

          <div className="seller-pending-notice">
            <strong>What's next?</strong>
            <p>
              Our administration team will review your application.
              You will be able to access your Seller Portal after
              your account has been approved.
            </p>
          </div>

          <button
            type="button"
            className="seller-register-button"
            onClick={() => navigate("/seller/login")}
          >
            Continue to Seller Login
          </button>

          <Link to="/" className="seller-register-home">
            Back to storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-register-page">
      <div className="seller-register-card">

        <Link to="/" className="seller-register-logo">
          ADRIAN<span> COLLECTIONS</span>
        </Link>

        <div className="seller-register-heading">
          <span className="seller-register-tag">SELLER PORTAL</span>

          <h1>Become a seller</h1>

          <p>
            Join Adrian Collections and start selling your products.
          </p>
        </div>

        {error && (
          <div className="seller-register-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Personal information */}
          <div className="seller-form-section">
            <h2>
              <FiUser /> Personal Information
            </h2>

            <div className="seller-form-grid">

              <div className="seller-form-field">
                <label>First name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="seller-form-field">
                <label>Last name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="seller-form-field">
                <label>Middle name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                />
              </div>

              <div className="seller-form-field">
                <label>Email address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="seller-form-field">
                <label>Phone number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 2567XXXXXXXX"
                  required
                />
              </div>

              <div className="seller-form-field">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={8}
                  autoComplete="new-password"
                  required
                />
                <small>Use at least 8 characters.</small>
              </div>

            </div>
          </div>

          {/* Business information */}
          <div className="seller-form-section">
            <h2>
              <FiBriefcase /> Business Information
            </h2>

            <div className="seller-form-field">
              <label>Business name *</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="Enter your business name"
                required
              />
            </div>

            <div className="seller-form-field">
              <label>Business description</label>
              <textarea
                name="business_description"
                value={formData.business_description}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about your business and products..."
              />
            </div>
          </div>

          {/* Address information */}
          <div className="seller-form-section">
            <h2>
              <FiMapPin /> Business Address
            </h2>

            <div className="seller-form-field">
              <label>Street address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="seller-form-grid">

              <div className="seller-form-field">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="seller-form-field">
                <label>State / District</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>

              <div className="seller-form-field">
                <label>Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>
          </div>

          <button
            type="submit"
            className="seller-register-button"
            disabled={loading}
          >
            {loading ? "Submitting application..." : "Submit Seller Application"}
          </button>

        </form>

        <div className="seller-register-footer">
          <p>
            Already have a seller account?{" "}
            <Link to="/seller/login">Sign in</Link>
          </p>

          <Link to="/" className="seller-register-home">
            Back to storefront
          </Link>
        </div>

      </div>
    </div>
  );
}

export default SellerRegister;
