
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import {
  FaSearch,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaShoppingBag,
  FaShoppingCart,
  FaUser,
  FaMoon,
  FaLeaf,
  FaSun,
  FaHome,
  FaCompass,
  FaUserCircle,
  FaThLarge,
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
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCollection =
    searchParams.get("collection") === "ladies"
      ? "ladies"
      : "men";

  const customer = useAuthStore((state) => state.customer);

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const { theme, toggleTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bottomCategoriesOpen, setBottomCategoriesOpen] =
    useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Include parent categories and their direct children.
  const allCategories = categories.flatMap((category) => [
    category,
    ...(category.children || []),
  ]);

  // Calculate total cart quantity.
  const cartCount = useCartStore((state) =>
    state.items.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
    )
  );

  // Close menus when screen becomes desktop-sized.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
        setBottomCategoriesOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close all navigation menus.
  const closeMenus = () => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
    setBottomCategoriesOpen(false);
  };

  // Build homepage URL while preserving collection.
  const getCollectionUrl = (extraParams = {}) => {
    const params = new URLSearchParams();

    params.set("collection", selectedCollection);

    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });

    return `/?${params.toString()}`;
  };

  // Switch between Men and Ladies.
  const changeCollection = (collection) => {
    if (!["men", "ladies"].includes(collection)) return;

    const params = new URLSearchParams(searchParams);

    params.set("collection", collection);

    // A category from the previous collection must not remain selected.
    params.delete("category");

    closeMenus();
    setSearch("");

    if (location.pathname !== "/") {
      navigate(`/?${params.toString()}`);
    } else {
      setSearchParams(params);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Navigate to the products section.
  const goToProducts = (event) => {
    event?.preventDefault();

    closeMenus();

    if (location.pathname !== "/") {
      navigate(getCollectionUrl());

      window.setTimeout(() => {
        document.getElementById("products")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 250);

      return;
    }

    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Navigate to a selected category.
  const goToCategory = (categoryId) => {
    closeMenus();

    navigate(
      getCollectionUrl({
        category: categoryId,
      })
    );

    window.setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  };

  // Navigate to all products in the selected collection.
  const goToAllProducts = () => {
    closeMenus();

    navigate(getCollectionUrl());

    window.setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  };

  // Toggle the bottom categories popup.
  const toggleBottomCategories = () => {
    setBottomCategoriesOpen((previous) => !previous);
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  };

  // Handle search submission.
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    goToProducts();
  };



  // Handle customer logout.
  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");

    try {
      await logoutCustomer();

      closeMenus();

      navigate(getCollectionUrl(), {
        replace: true,
      });
    } catch (error) {
      console.error("Logout request failed:", error);

      setLogoutError(
        "You have been logged out locally, but the server could not be reached."
      );

      closeMenus();

      navigate(getCollectionUrl(), {
        replace: true,
      });
    } finally {
      setLoggingOut(false);
    }
  };

  // Handle account navigation.
  const handleAccountClick = () => {
    closeMenus();

    if (isAuthenticated && customer) {
      navigate("/account");
    } else {
      navigate("/login", {
        state: {
          from: {
            pathname: "/account",
          },
        },
      });
    }
  };

  // Reusable collection switcher.
  const renderCollectionSwitcher = (className = "") => (
    <div className={`navbar-collection-switch ${className}`}>
      <button
        type="button"
        className={
          selectedCollection === "men"
            ? "active"
            : ""
        }
        onClick={() => changeCollection("men")}
        aria-pressed={selectedCollection === "men"}
      >
        MEN
      </button>

      <button
        type="button"
        className={
          selectedCollection === "ladies"
            ? "active"
            : ""
        }
        onClick={() => changeCollection("ladies")}
        aria-pressed={selectedCollection === "ladies"}
      >
        LADIES
      </button>
    </div>
  );

  return (
    <header className="navbar">

      {/* Promotional announcement */}

     

      {/* Main navigation */}

      <div className="navbar-main">

        <div className="navbar-container">

          {/* Mobile menu toggle */}

          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() =>
              setMobileMenuOpen((previous) => !previous)
            }
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="navbar-mobile-menu"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {/* Brand */}

          <Link
            to={getCollectionUrl()}
            className="navbar-logo"
            onClick={closeMenus}
            aria-label="Living Earth home"
          >

            <FaLeaf/>
            <span className="navbar-logo-main">
              LIVING
              <span> EARTH</span>
            </span>

            <small>GROUNDED IN NATURE</small>
          </Link>

          {/* Desktop navigation */}

          <nav className="navbar-desktop-links">

            <a href="#products" onClick={goToProducts}>
              SHOP
            </a>

            <a href="#products" onClick={goToProducts}>
              NEW DROPS
            </a>
             <Link
                to="/about"
                onClick={closeMenus}>
                  ABOUT US
              </Link>

              <Link
                to="/contact"
                onClick={closeMenus}>
                  CONTACT
                </Link>

            <div className="navbar-category-wrapper">

              <button
                type="button"
                className="navbar-category-button"
                aria-expanded={dropdownOpen}
                onClick={() => {
                  setDropdownOpen((previous) => !previous);
                }}
              >
                CATEGORIES

                <FaChevronDown
                  className={dropdownOpen ? "rotate-icon" : ""}
                />
              </button>

              {dropdownOpen && (
                <div className="navbar-category-dropdown">

                  <button
                    type="button"
                    onClick={goToAllProducts}
                  >
                    ALL {selectedCollection.toUpperCase()} PRODUCTS
                  </button>

                  {allCategories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => goToCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}

                </div>
              )}

            </div>

          </nav>

          {/* Desktop collection switcher */}

          {renderCollectionSwitcher("navbar-collection-desktop")}

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

          {/* Desktop actions */}

          <div className="navbar-actions">

           

            {/* Shopping cart */}

            <Link
              to="/cart"
              className="navbar-cart-link"
              aria-label={`Shopping cart, ${cartCount} items`}
            >
              <FaShoppingCart />

              <span className="navbar-cart-text">
                CART
              </span>

              {cartCount > 0 && (
                <span className="cart-count-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Authentication */}

            {isAuthenticated && customer ? (

              <div className="navbar-user">

                <Link
                  to="/account"
                  className="navbar-user-name"
                >
                  <FaUser />
                  MY ACCOUNT
                </Link>

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

                <Link
                  to="/login"
                  className="navbar-login-link"
                >
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

        {/* Mobile expandable navigation */}

        <nav
          id="navbar-mobile-menu"
          className={`navbar-mobile-menu ${
            mobileMenuOpen ? "is-open" : ""
          }`}
          aria-label="Mobile navigation"
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen}
        >

          <div className="mobile-collection-section">
            <span>SHOP COLLECTION</span>

            {renderCollectionSwitcher("navbar-collection-mobile")}
          </div>

          <a href="#products" onClick={goToProducts}>
            SHOP
          </a>

          <a href="#products" onClick={goToProducts}>
            NEW DROPS
          </a>

           <Link
                to="/about"
                onClick={closeMenus}>
                  ABOUT US
            </Link>
            <Link
              to="/contact"
              onClick ={closeMenus}>
                CONTACT
            </Link>

          {/* Categories */}

          <button
            type="button"
            className="mobile-category-toggle"
            aria-expanded={dropdownOpen}
            onClick={() => {
              setDropdownOpen((previous) => !previous);
            }}
          >
            CATEGORIES

            <FaChevronDown
              className={dropdownOpen ? "rotate-icon" : ""}
            />
          </button>

          {dropdownOpen && (
            <div className="mobile-category-list">

              <button
                type="button"
                onClick={goToAllProducts}
              >
                ALL PRODUCTS
              </button>

              {allCategories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => goToCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}

            </div>
          )}

          {/* Shopping bag */}

          <Link
            to="/cart"
            onClick={closeMenus}
            className="mobile-cart-link"
          >
            <FaShoppingBag />
            SHOPPING BAG ({cartCount})
          </Link>

          {/* Mobile account section */}

          <div className="mobile-account-section">

            {isAuthenticated && customer ? (

              <>
                <p>
                  WELCOME, {customer.first_name}
                </p>

                <Link
                  to="/account"
                  onClick={closeMenus}
                >
                  <FaUserCircle />
                  MY ACCOUNT
                </Link>

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
                <Link
                  to="/login"
                  onClick={closeMenus}
                >
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

      {/* Mobile bottom navigation and category popup */}

      <div className="mobile-bottom-wrapper">

        {/* Categories popup */}

        {bottomCategoriesOpen && (
          <div
            className="bottom-categories-popup"
            aria-label="Product categories"
          >

            <div className="bottom-categories-header">
              <h3>
                SHOP {selectedCollection.toUpperCase()} BY CATEGORY
              </h3>

              <button
                type="button"
                onClick={() => setBottomCategoriesOpen(false)}
                aria-label="Close categories"
              >
                <FaTimes />
              </button>
            </div>

            <div className="bottom-categories-list">

              <button
                type="button"
                className="bottom-category-item"
                onClick={goToAllProducts}
              >
                ALL PRODUCTS
              </button>

              {allCategories.length > 0 ? (

                allCategories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className="bottom-category-item"
                    onClick={() => goToCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))

              ) : (

                <p className="no-bottom-categories">
                  No categories available.
                </p>

              )}

            </div>

          </div>
        )}

        {/* Bottom navigation */}

        <nav
          className="mobile-bottom-nav"
          aria-label="Mobile bottom navigation"
        >

          <Link
            to={getCollectionUrl()}
            onClick={closeMenus}
            className={`bottom-nav-item ${
              location.pathname === "/" &&
              !location.search.includes("category=")
                ? "active"
                : ""
            }`}
          >
            <FaHome />
            <span>Home</span>
          </Link>

          <button
            type="button"
            className={`bottom-nav-item ${
              bottomCategoriesOpen ||
              location.search.includes("category=")
                ? "active"
                : ""
            }`}
            onClick={toggleBottomCategories}
            aria-expanded={bottomCategoriesOpen}
          >
            <FaThLarge />
            <span>Categories</span>
          </button>

          <button
            type="button"
            className="bottom-nav-item"
            onClick={goToProducts}
          >
            <FaCompass />
            <span>Explore</span>
          </button>

          <Link
            to="/cart"
            onClick={closeMenus}
            className={`bottom-nav-item ${
              location.pathname === "/cart" ? "active" : ""
            }`}
          >
            <span className="bottom-nav-cart-icon">
              <FaShoppingBag />

              {cartCount > 0 && (
                <span className="bottom-nav-cart-count">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </span>

            <span>Cart</span>
          </Link>

          <button
            type="button"
            className={`bottom-nav-item ${
              location.pathname === "/account" ||
              location.pathname === "/login" ||
              location.pathname === "/register"
                ? "active"
                : ""
            }`}
            onClick={handleAccountClick}
          >
            <FaUserCircle />
            <span>Account</span>
          </button>

        </nav>

      </div>

      {/* Logout error */}

      {logoutError && (
        <p
          className="navbar-error-message"
          role="alert"
        >
          {logoutError}
        </p>
      )}

    </header>
  );
}

export default Navbar;
