import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";

import { registerSeller } from "../../services/sellerApi";
import "./SellerAuth.css";

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
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await registerSeller(formData);

            setSuccess(
                "Registration successful! Your application is awaiting administrator approval."
            );

            setTimeout(() => {
                navigate("/login");
            }, 2500);

        } catch (err) {
            const responseErrors = err.response?.data?.errors;

            if (responseErrors) {
                setError(
                    Object.values(responseErrors).flat().join(" ")
                );
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

    return (
        <div className="seller-auth-page">

            <div className="seller-auth-card">

                <div className="seller-auth-brand">
                    <FaStore />
                    <h2>ADRIAN <span>SELLER</span></h2>
                </div>

                <h1>Create Seller Account</h1>

                <p className="seller-auth-subtitle">
                    Join Adrian Collections and start selling your products.
                </p>

                {error && (
                    <div className="seller-auth-message error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="seller-auth-message success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <h3>Personal Information</h3>

                    <div className="seller-form-grid">

                        <div className="seller-form-group">
                            <label>First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>Middle Name</label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>Password *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                minLength="8"
                                required
                            />
                        </div>

                    </div>

                    <h3>Business Information</h3>

                    <div className="seller-form-group">
                        <label>Business Name *</label>
                        <input
                            type="text"
                            name="business_name"
                            value={formData.business_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="seller-form-group">
                        <label>Business Description</label>
                        <textarea
                            name="business_description"
                            value={formData.business_description}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div className="seller-form-grid">

                        <div className="seller-form-group">
                            <label>Address *</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>City *</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="seller-form-group">
                            <label>State / Region</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="seller-form-group">
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

                    <button
                        type="submit"
                        className="seller-auth-button"
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Register as Seller"}
                    </button>

                </form>

                <p className="seller-auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>

            </div>

        </div>
    );
}

export default SellerRegister;
