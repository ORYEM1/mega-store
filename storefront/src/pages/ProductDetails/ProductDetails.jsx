import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCheck,
  FaMinus,
  FaPlus,
  FaShoppingBag,
} from "react-icons/fa";

import { getProducts } from "../../services/api";
import Navbar from "../../components/Navbar/Navbar";
import { useCartStore } from "../../store/cartStore";

import "./ProductDetails.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function normalizeStock(value) {
  const stock = Number(value);

  if (!Number.isFinite(stock) || stock < 0) {
    return 0;
  }

  return Math.floor(stock);
}

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  // Fetch products from Laravel.
  const fetchProducts = useCallback(
    async ({ showLoading = false } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        const response = await getProducts();

        const productList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        setProducts(productList);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("We could not load this product. Please try again.");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Initial product loading.
  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await getProducts();

        const productList = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (!cancelled) {
          setProducts(productList);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);

        if (!cancelled) {
          setError("We could not load this product. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Refresh product information when the customer returns.
  useEffect(() => {
    function handleWindowFocus() {
      fetchProducts();
    }

    function handlePageShow() {
      fetchProducts();
    }

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [fetchProducts]);

  // Find the selected product.
  const product = useMemo(
    () => products.find((item) => String(item.id) === String(id)),
    [products, id]
  );

  // Find similar products.
  const similarProducts = useMemo(() => {
    if (!product?.category?.id) {
      return [];
    }

    return products
      .filter(
        (item) =>
          String(item.id) !== String(product.id) &&
          String(item.category?.id) === String(product.category.id)
      )
      .slice(0, 4);
  }, [products, product]);

  const stock = normalizeStock(product?.stock_quantity);
  const available = stock > 0;

  const hasDiscount =
    product &&
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    Number(product.compare_at_price) > Number(product.price);

  // Reset quantity and messages when switching products.
  useEffect(() => {
    setQuantity(1);
    setMessage("");
    setMessageType("");
  }, [id]);

  // Keep quantity within available stock.
  useEffect(() => {
    if (stock === 0) {
      setQuantity(1);
      return;
    }

    setQuantity((currentQuantity) =>
      Math.min(Math.max(1, currentQuantity), stock)
    );
  }, [stock]);

  // Add product to cart.
  function addToCart() {
    if (!product) return;

    const currentStock = normalizeStock(product.stock_quantity);

    if (currentStock < 1) {
      setMessage("Sorry, this product is currently out of stock.");
      setMessageType("error");
      return;
    }

    const selectedQuantity = Math.max(
      1,
      Math.floor(Number(quantity) || 1)
    );

    if (selectedQuantity > currentStock) {
      setMessage(`Only ${currentStock} units are available.`);
      setMessageType("error");
      return;
    }

    const existingItem = cartItems.find(
      (item) => String(item.id) === String(product.id)
    );

    const currentCartQuantity = normalizeStock(existingItem?.quantity);

    if (currentCartQuantity + selectedQuantity > currentStock) {
      const remaining = Math.max(
        0,
        currentStock - currentCartQuantity
      );

      setMessage(
        remaining > 0
          ? `You already have ${currentCartQuantity} in your cart. You can add ${remaining} more.`
          : "You already have all available stock in your cart."
      );

      setMessageType("error");
      return;
    }

    addItem(
      {
        ...product,
        price: Number(product.price) || 0,
        photo: product.photo || null,
        stock_quantity: currentStock,
      },
      selectedQuantity
    );

    setMessage("PRODUCT ADDED TO YOUR BAG!");
    setMessageType("success");
  }

  function proceedToCart() {
    navigate("/cart");
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(stock, current + 1));
  }

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  // Loading screen.
  if (loading) {
    return (
      <div className="product-details-page">
        <Navbar search={search} setSearch={setSearch} />

        <div className="product-details-message">
          <div className="details-loader"></div>
          <p>LOADING PRODUCT...</p>
        </div>
      </div>
    );
  }

  // Error screen.
  if (error && products.length === 0) {
    return (
      <div className="product-details-page">
        <Navbar search={search} setSearch={setSearch} />

        <div className="product-details-message product-details-error">
          <h2>SOMETHING WENT WRONG</h2>
          <p>{error}</p>

          <button
            type="button"
            className="details-retry-button"
            onClick={() => fetchProducts({ showLoading: true })}
          >
            TRY AGAIN <FaArrowRight />
          </button>

          <Link to="/">RETURN TO SHOPPING</Link>
        </div>
      </div>
    );
  }

  // Product not found.
  if (!product) {
    return (
      <div className="product-details-page">
        <Navbar search={search} setSearch={setSearch} />

        <div className="product-details-message">
          <h2>PRODUCT NOT FOUND</h2>

          <p>
            This product may no longer be published or may not exist.
          </p>

          <Link to="/">RETURN TO SHOPPING</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <Navbar search={search} setSearch={setSearch} />

      <main className="product-details-main">

        {/* Breadcrumb */}
        <nav className="product-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">HOME</Link>
          <span>/</span>

          {product.category && (
            <>
              <span>{product.category.name}</span>
              <span>/</span>
            </>
          )}

          <span>{product.name}</span>
        </nav>

        {/* Product section */}
        <section className="product-details-layout">

          {/* Product image */}
          <div className="product-details-image-wrapper">

            {product.photo ? (
              <img
                src={product.photo}
                alt={product.name}
                className="product-details-image"
              />
            ) : (
              <div className="product-details-no-image">
                <span>AC.</span>
                <p>NO IMAGE AVAILABLE</p>
              </div>
            )}

            <div className="details-image-label">
              ADRIAN COLLECTIONS
            </div>

            {!available && (
              <span className="product-out-of-stock">
                SOLD OUT
              </span>
            )}

            {hasDiscount && available && (
              <span className="details-sale-badge">
                SALE
              </span>
            )}
          </div>

          {/* Product information */}
          <div className="product-details-info">

            <div className="details-product-topline">
              <p className="product-details-category">
                {product.category?.name || "UNCATEGORIZED"}
              </p>

              {available && (
                <span className="details-available">
                  <FaBolt /> IN STOCK
                </span>
              )}
            </div>

            <h1>{product.name}</h1>

            {product.sku && (
              <p className="product-details-sku">
                PRODUCT CODE: {product.sku}
              </p>
            )}

            {/* Pricing */}
            <div className="product-details-pricing">
              <span className="product-details-price">
                {formatPrice(product.price)}
              </span>

              {hasDiscount && (
                <span className="product-details-old-price">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            <div className="details-divider"></div>

            {/* Stock information */}
            <p
              className={`product-details-stock ${
                available ? "available" : "unavailable"
              }`}
            >
              {available
                ? `${stock} UNITS AVAILABLE`
                : "CURRENTLY OUT OF STOCK"}
            </p>

            {/* Description */}
            <div className="product-details-description">
              <h2>PRODUCT DETAILS</h2>

              <p>
                {product.description ||
                  "No description is available for this product yet."}
              </p>
            </div>

            {/* Quantity selector */}
            {available && (
              <div className="product-quantity">
                <label htmlFor="product-quantity">
                  SELECT QUANTITY
                </label>

                <div className="product-quantity-controls">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <FaMinus />
                  </button>

                  <span
                    id="product-quantity"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= stock}
                    aria-label="Increase quantity"
                  >
                    <FaPlus />
                  </button>
                </div>
              </div>
            )}

            {/* Cart buttons */}
            <div className="product-details-buttons">
              <button
                type="button"
                className="product-add-to-cart"
                onClick={addToCart}
                disabled={!available}
              >
                <FaShoppingBag />

                {available ? "ADD TO BAG" : "SOLD OUT"}

                {available && <FaArrowRight />}
              </button>

              <button
                type="button"
                className="product-proceed-to-cart"
                onClick={proceedToCart}
              >
                VIEW YOUR BAG
              </button>
            </div>

            {/* Cart message */}
            {message && (
              <p
                className={`product-cart-message ${messageType}`}
                role="status"
              >
                {messageType === "success" && <FaCheck />}
                {message}
              </p>
            )}

            <div className="product-details-note">
              <FaBolt />
              <span>YOUR CART IS SAVED ON THIS DEVICE.</span>
            </div>
          </div>
        </section>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <section className="similar-products">

            <div className="similar-products-heading">
              <div>
                <p className="section-eyebrow">
                  THE COLLECTION
                </p>

                <h2>YOU MAY ALSO LIKE<span>.</span></h2>
              </div>

              <Link to="/">
                EXPLORE MORE <FaArrowRight />
              </Link>
            </div>

            <div className="similar-products-grid">
              {similarProducts.map((item) => {
                const itemStock = normalizeStock(item.stock_quantity);

                return (
                  <Link
                    key={item.id}
                    to={`/products/${item.id}`}
                    className="similar-product-card"
                  >
                    <div className="similar-product-image-wrapper">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="similar-product-no-image">
                          AC.
                        </div>
                      )}

                      {itemStock === 0 && (
                        <span className="product-out-of-stock">
                          SOLD OUT
                        </span>
                      )}
                    </div>

                    <div className="similar-product-info">
                      <h3>{item.name}</h3>

                      <p className="similar-product-price">
                        {formatPrice(item.price)}
                      </p>

                      <p className="similar-product-stock">
                        {itemStock > 0
                          ? `${itemStock} AVAILABLE`
                          : "CURRENTLY UNAVAILABLE"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Continue shopping */}
        <div className="product-details-back">
          <Link to="/">
            <FaArrowLeft />
            CONTINUE SHOPPING
          </Link>
        </div>

      </main>
    </div>
  );
}

export default ProductDetails;