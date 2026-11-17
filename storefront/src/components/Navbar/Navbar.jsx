import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaSearch,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaShoppingBag,
  FaUser,
  FaMoon,
  FaSun,
} from "react-icons/fa";

import { logoutCustomer } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useTheme } from "../../contexts/ThemeContext";

import "./Navbar.css";

function Navbar({
  categories = [],
  search = "",
  setSearch = () => {},
}) {
  const navigate = useNavigate();

  const customer = useAuthStore((state) => state.customer);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Include parent categories and their direct children.
  const allCategories = categories.flatMap((category) => [
    category,
    ...(category.children || []),
  ]);

  const cartCount = useCartStore((state) =>
    state.items.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
    )
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  // Navigate to the products section on the homepage.
  const goToProducts = (event) => {
    event?.preventDefault();
    closeMenus();

    if (window.location.pathname !== "/") {
      navigate("/");

      window.setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 200);

      return;
    }

    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    goToProducts();
  };

  // Switch between light and dark themes.
  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");

    try {
      await logoutCustomer();
      closeMenus();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout request failed:", error);

      setLogoutError(
        "You have been logged out locally, but the server could not be reached."
      );

      closeMenus();
      navigate("/", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="navbar">
      {/* Promotional announcement */}
      <div className="navbar-announcement">
        <p>
          NEW SEASON. NEW ENERGY.
          <span> DISCOVER YOUR STYLE.</span>
        </p>
      </div>

      {/* Main navigation */}
      <div className="navbar-main">
        <div className="navbar-container">
          {/* Brand */}
          <Link
            to="/"
            className="navbar-logo"
            onClick={closeMenus}
            aria-label="Adrian Collections home"
          >
            MEGA<span>.</span>
            <small>STORE</small>
          </Link>

          {/* Desktop navigation */}
          <nav className="navbar-desktop-links">
            <a href="#products" onClick={goToProducts}>
              SHOP
            </a>

            <a href="#products" onClick={goToProducts}>
              NEW DROPS
            </a>

            <div className="navbar-category-wrapper">
              <button
                type="button"
                className="navbar-category-button"
                aria-expanded={dropdownOpen}
                onClick={() =>
                  setDropdownOpen((previous) => !previous)
                }
              >
                CATEGORIES

                <FaChevronDown
                  className={dropdownOpen ? "rotate-icon" : ""}
                />
              </button>

              {dropdownOpen && (
                <div className="navbar-category-dropdown">
                  <a href="#products" onClick={goToProducts}>
                    ALL PRODUCTS
                  </a>

                  {allCategories.map((category) => (
                    <a
                      key={category.id}
                      href={`#category-${category.id}`}
                      onClick={closeMenus}
                    >
                      {category.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop search */}
          <form
            className="navbar-search navbar-search-desktop"
            onSubmit={handleSearchSubmit}
            role="search"
          >
            <FaSearch />

            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search products"
            />
          </form>

          {/* Right-side actions */}
          <div className="navbar-actions">

            {/* Theme toggle */}
            <button
              type="button"
              className="navbar-theme-toggle"
              onClick={handleThemeToggle}
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
              title={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
            >
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>

            {/* Shopping cart */}
            <Link
              to="/cart"
              className="navbar-cart-link"
              aria-label={`Shopping cart, ${cartCount} items`}
            >
              <FaShoppingBag />

              <span className="navbar-cart-text">BAG</span>

              {cartCount > 0 && (
                <span className="cart-count-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Authentication */}
            {isAuthenticated && customer ? (
              <div className="navbar-user">
                <span className="navbar-user-name">
                  <FaUser />
                  {customer.first_name}
                </span>

                <button
                  type="button"
                  className="navbar-login-button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "WAIT..." : "LOGOUT"}
                </button>
              </div>
            ) : (
              <div className="navbar-auth-actions">
                <Link to="/login" className="navbar-login-link">
                  LOGIN
                </Link>

                <Link
                  to="/register"
                  className="navbar-register-button"
                >
                  JOIN US
                </Link>
              </div>
            )}
          </div>

          {/* Mobile theme toggle */}
          <button
              type="button"
              className="mobile-theme-toggle"
              onClick={handleThemeToggle}
              aria-label={`Switch to ${
                  theme === "dark" ? "light" : "dark"
              } mode`}
          >
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            
              {theme === "dark"
                  ? "SWITCH TO LIGHT MODE"
                  : "SWITCH TO DARK MODE"}
          </button>
        </div>

        {/* Mobile search */}
        <form
          className="navbar-search navbar-search-mobile"
          onSubmit={handleSearchSubmit}
          role="search"
        >
          <FaSearch />

          <input
            type="search"
            placeholder="Search the collection..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
          />
        </form>

        {/* Mobile navigation */}
        <nav
          id="navbar-mobile-menu"
          className={`navbar-mobile-menu ${
            mobileMenuOpen ? "is-open" : ""
          }`}
          aria-label="Mobile navigation"
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen}
        >
          <a href="#products" onClick={goToProducts}>
            SHOP
          </a>

          <a href="#products" onClick={goToProducts}>
            NEW DROPS
          </a>

          <button
            type="button"
            className="mobile-category-toggle"
            aria-expanded={dropdownOpen}
            onClick={() =>
              setDropdownOpen((previous) => !previous)
            }
          >
            CATEGORIES

            <FaChevronDown
              className={dropdownOpen ? "rotate-icon" : ""}
            />
          </button>

          {dropdownOpen && (
            <div className="mobile-category-list">
              <a href="#products" onClick={goToProducts}>
                ALL PRODUCTS
              </a>

              {allCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  onClick={closeMenus}
                >
                  {category.name}
                </a>
              ))}
            </div>
          )}

          <Link
            to="/cart"
            onClick={closeMenus}
            className="mobile-cart-link"
          >
            <FaShoppingBag />
            SHOPPING BAG ({cartCount})
          </Link>

          {/* Mobile theme toggle */}
          <button
            type="button"
            className="mobile-theme-toggle"
            onClick={handleThemeToggle}
          >
            {theme === "dark" ? <FaSun /> : <FaMoon />}

            {theme === "dark"
              ? "SWITCH TO LIGHT MODE"
              : "SWITCH TO DARK MODE"}
          </button>

          <div className="mobile-account-section">
            {isAuthenticated && customer ? (
              <>
                <p>WELCOME, {customer.first_name}</p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "LOGGING OUT..." : "LOGOUT"}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenus}>
                  LOGIN
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenus}
                  className="mobile-register-button"
                >
                  CREATE ACCOUNT
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {logoutError && (
        <p className="navbar-error-message" role="alert">
          {logoutError}
        </p>
      )}
    </header>
  );
}

export default Navbar;