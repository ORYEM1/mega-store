import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaStore } from "react-icons/fa";

import { loginSeller } from "../../services/sellerApi";
import useSellerAuthStore from "../../store/sellerAuthStore";
import "./SellerAuth.css";

function SellerLogin() {
    const navigate = useNavigate();
    const setAuth = useSellerAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({
        login: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

        try {
            const response = await loginSeller(formData);

            if (!response.seller || !response.token) {
                throw new Error("The login response is missing seller or token information.");
            }

            setAuth(response.seller, response.token);

            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Login failed. Please check your details."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="seller-auth-page">

            <div className="seller-auth-card seller-login-card">

                <div className="seller-auth-brand">
                    <FaStore />
                    <h2>MEGA STORE <span>SELLER</span></h2>
                </div>

                <h1>Welcome Back</h1>

                <p className="seller-auth-subtitle">
                    Sign in to manage your seller account.
                </p>

                {error && (
                    <div className="seller-auth-message error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="seller-form-group">
                        <label>Email Address or Phone Number</label>

                        <input
                            type="text"
                            name="login"
                            value={formData.login}
                            onChange={handleChange}
                            placeholder="Enter email or phone number"
                            required
                        />
                    </div>

                    <div className="seller-form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="seller-auth-button"
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </button>

                </form>

                <p className="seller-auth-footer">
                     Seller accounts are created through mega store Collections administration.
                </p>

            </div>

        </div>
    );
}

export default SellerLogin;
