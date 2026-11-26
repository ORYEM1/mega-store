import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaArrowRight,
  FaExclamationCircle,
} from "react-icons/fa";

import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

import "./Register.css";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    address: "",
    city: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Update form values.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    // Clear the validation error for the field being edited.
    setErrors((previous) => ({
      ...previous,
      [name]: undefined,
      general: undefined,
    }));
  };

  // Submit registration form.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrors({});

    // Validate password confirmation.
    if (formData.password !== formData.password_confirmation) {
      setErrors({
        password_confirmation: ["The passwords do not match."],
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/register", formData);

      const { token, customer } = response.data;

      if (!token || !customer) {
        throw new Error(
          "The registration response did not contain a token and customer."
        );
      }

      // Save authentication details using Zustand.
      setAuth({
        token,
        customer,
      });

      // Redirect to the original destination, if available.
      const destination = location.state?.from;

      navigate(destination?.pathname || "/", {
        replace: true,
      });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(
          error.response.data.errors || {
            general: [
              error.response.data.message ||
                "Please check your registration details.",
            ],
          }
        );
      } else {
        setErrors({
          general: [
            error.response?.data?.message ||
              error.message ||
              "Registration failed. Please check your connection and try again.",
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Display a validation error for an individual field.
  const renderError = (field) => {
    if (!errors[field]) return null;

    return (
      <p className="register-field-error" role="alert">
        {errors[field][0]}
      </p>
    );
  };

  return (
    <div className="auth-page register-page">
      {/* Decorative section */}
      <div className="auth-decoration">
        <span className="auth-decoration-text">LIVING EARTH APPARELS.</span>

        <div className="auth-decoration-content">
          <p className="auth-eyebrow">JOIN THE MOVEMENT.</p>

          <h2>
            DEFINE
            <br />
            YOUR
            <br />
            <span>STYLE.</span>
          </h2>

          <p>Create your account and discover your next favourite look.</p>
        </div>
      </div>

      {/* Registration section */}
      <div className="auth-form-section">
        <div className="register-container">
          <Link to="/" className="auth-logo">
            LIVING EARTH APPARELS<span>.</span>
          </Link>

          <div className="auth-heading">
            <p className="auth-eyebrow">GET STARTED</p>
            <h1>CREATE ACCOUNT.</h1>

            <p>
              Join LIVING EARTH APPARELS and start shopping your style.
            </p>
          </div>

          {/* General errors */}
          {errors.general && (
            <div className="register-general-error" role="alert">
              <FaExclamationCircle />

              <div>
                {errors.general.map((message, index) => (
                  <p key={index}>{message}</p>
                ))}
              </div>
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            {/* First name */}
            <div className="register-field">
              <label htmlFor="first_name">FIRST NAME</label>

              <div className="register-input-wrapper">
                <FaUser />

                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                  required
                />
              </div>

              {renderError("first_name")}
            </div>

            {/* Last name */}
            <div className="register-field">
              <label htmlFor="last_name">LAST NAME</label>

              <div className="register-input-wrapper">
                <FaUser />

                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                  required
                />
              </div>

              {renderError("last_name")}
            </div>

            {/* Email */}
            <div className="register-field">
              <label htmlFor="email">EMAIL ADDRESS (OPTIONAL)</label>

              <div className="register-input-wrapper">
                <FaEnvelope />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  autoComplete="email"
                />
              </div>

              {renderError("email")}
            </div>

            {/* Phone */}
            <div className="register-field">
              <label htmlFor="phone">PHONE NUMBER</label>

              <div className="register-input-wrapper">
                <FaPhone />

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  required
                />
              </div>

              {renderError("phone")}
            </div>

            {/* Address */}
            <div className="register-field register-full-width">
              <label htmlFor="address">ADDRESS</label>

              <div className="register-input-wrapper register-textarea-wrapper">
                <FaMapMarkerAlt />

                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your delivery address"
                  autoComplete="street-address"
                />
              </div>

              {renderError("address")}
            </div>

            {/* City */}
            <div className="register-field register-full-width">
              <label htmlFor="city">CITY</label>

              <div className="register-input-wrapper">
                <FaMapMarkerAlt />

                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  autoComplete="address-level2"
                />
              </div>

              {renderError("city")}
            </div>

            {/* Password */}
            <div className="register-field">
              <label htmlFor="password">PASSWORD</label>

              <div className="register-input-wrapper">
                <FaLock />

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {renderError("password")}
            </div>

            {/* Confirm password */}
            <div className="register-field">
              <label htmlFor="password_confirmation">
                CONFIRM PASSWORD
              </label>

              <div className="register-input-wrapper">
                <FaLock />

                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {renderError("password_confirmation")}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="register-submit-button"
              disabled={loading}
            >
              {loading ? (
                "CREATING ACCOUNT..."
              ) : (
                <>
                  CREATE ACCOUNT <FaArrowRight />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="register-footer">
            <p>
              Already have an account?{" "}
              <Link to="/login">LOG IN</Link>
            </p>

            <Link to="/" className="register-back-link">
              Back to shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;