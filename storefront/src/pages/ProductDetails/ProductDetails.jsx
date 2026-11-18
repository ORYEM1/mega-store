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
  FaStar,
  FaRegStar,
  FaEdit,
  FaWhatsapp,
} from "react-icons/fa";

import {
  getProducts,
  getProductReviews,
  submitProductReview,
} from "../../services/api";

import Navbar from "../../components/Navbar/Navbar";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

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

  // =====================================
  // PRODUCT STATE
  // =====================================

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =====================================
  // CART STORE
  // =====================================

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  // =====================================
  // AUTHENTICATION STORE
  // =====================================

  const customer = useAuthStore((state) => state.customer);

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  // =====================================
  // REVIEW STATE
  // =====================================

  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewError, setReviewError] = useState("");

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const [editingReview, setEditingReview] = useState(false);

  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState(null);

  // =====================================
  // FETCH PRODUCTS
  // =====================================

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

  // =====================================
  // SELECTED PRODUCT
  // =====================================

  const product = useMemo(
    () => products.find((item) => String(item.id) === String(id)),
    [products, id]
  );

  // =====================================
// PRODUCT SEO METADATA
// =====================================

useEffect(() => {
  if (!product) return;

  const siteUrl =
    import.meta.env.VITE_SITE_URL || window.location.origin;

  const productUrl = `${siteUrl.replace(/\/$/, "")}/products/${product.id}`;

  const title = `${product.name} | Mega Store`;

  const description = (
    product.description ||
    `Shop ${product.name} at Mega Store.`
  ).replace(/\s+/g, " ").slice(0, 160);

  const image = product.photo || "";

  // Update browser title.
  document.title = title;

  // Create or update metadata.
  const updateMeta = (attribute, key, content) => {
    let element = document.head.querySelector(
      `meta[${attribute}="${key}"]`
    );

    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(attribute, key);
      document.head.appendChild(element);
    }

    element.setAttribute("content", content);
  };

  updateMeta("name", "description", description);
  updateMeta("name", "robots", "index, follow");

  updateMeta("property", "og:type", "product");
  updateMeta("property", "og:title", title);
  updateMeta("property", "og:description", description);
  updateMeta("property", "og:url", productUrl);
  updateMeta("property", "og:image", image);

  updateMeta("name", "twitter:card", "summary_large_image");
  updateMeta("name", "twitter:title", title);
  updateMeta("name", "twitter:description", description);
  updateMeta("name", "twitter:image", image);

  // Canonical URL.
  let canonical = document.head.querySelector(
    'link[rel="canonical"]'
  );

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }

  canonical.href = productUrl;

}, [product]);


// =====================================
// PRODUCT STRUCTURED DATA (JSON-LD)
// =====================================

useEffect(() => {
  if (!product) return;

  const siteUrl =
    import.meta.env.VITE_SITE_URL || window.location.origin;

  const productUrl =
    `${siteUrl.replace(/\/$/, "")}/products/${product.id}`;

  const imageUrl = product.photo || undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",

    name: product.name,

    description:
      product.description ||
      `Shop ${product.name} at Mega Store.`,

    sku: product.sku || undefined,

    image: imageUrl ? [imageUrl] : undefined,

    brand: {
      "@type": "Brand",
      name: "Mega Store",
    },

    offers: {
      "@type": "Offer",

      url: productUrl,

      priceCurrency: "UGX",

      price: Number(product.price).toFixed(0),

      availability:
        Number(product.stock_quantity) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",

      itemCondition: "https://schema.org/NewCondition",
    },
  };

  let script = document.getElementById("product-json-ld");

  if (!script) {
    script = document.createElement("script");
    script.id = "product-json-ld";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(productSchema);

  return () => {
    document.getElementById("product-json-ld")?.remove();
  };
}, [product]);

  // =====================================
  // SIMILAR PRODUCTS
  // =====================================

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

  // =====================================
  // PRODUCT SIZES
  // =====================================

  const productSizes = useMemo(
    () => (Array.isArray(product?.sizes) ? product.sizes : []),
    [product]
  );

  const hasSizes = productSizes.length > 0;

  const selectedSizeOption = useMemo(
    () =>
      productSizes.find(
        (item) => String(item.size) === String(selectedSize)
      ) || null,
    [productSizes, selectedSize]
  );

  const totalStock = normalizeStock(product?.stock_quantity);

  const selectedSizeStock = selectedSizeOption
    ? normalizeStock(selectedSizeOption.stock_quantity)
    : 0;

  const stock = hasSizes
    ? selectedSizeOption
      ? selectedSizeStock
      : totalStock
    : totalStock;

  const available = totalStock > 0;

  const hasDiscount =
    product &&
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    Number(product.compare_at_price) > Number(product.price);

  // =====================================
  // RESET WHEN CHANGING PRODUCTS
  // =====================================

  useEffect(() => {
    setQuantity(1);
    setSelectedSize("");

    setMessage("");
    setMessageType("");

    setReviewPage(1);
    setRating(0);
    setReviewText("");
    setEditingReview(false);
    setReviewMessage("");
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

  // =====================================
  // PRODUCT REVIEW FUNCTIONS
  // =====================================

  const fetchReviews = useCallback(async () => {
    if (!id) return;

    try {
      setReviewsLoading(true);
      setReviewError("");

      const response = await getProductReviews(id, reviewPage);

      const paginator = response.reviews;

      setReviews(
        Array.isArray(paginator?.data)
          ? paginator.data
          : []
      );

      setReviewPagination(paginator || null);

      setMyReview(response.my_review || null);
    } catch (err) {
      console.error("Failed to load product reviews:", err);

      setReviewError(
        "Unable to load reviews. Please try again."
      );
    } finally {
      setReviewsLoading(false);
    }
  }, [id, reviewPage]);

  // Load reviews when the product or review page changes.
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Prepare an existing review for editing.
  function handleEditReview() {
    if (!myReview) return;

    setRating(Number(myReview.rating));
    setReviewText(myReview.review || "");

    setEditingReview(true);
    setReviewMessage("");

    document
      .getElementById("product-review-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }

  // Cancel editing.
  function cancelReviewEdit() {
    setRating(0);
    setReviewText("");

    setEditingReview(false);
    setReviewMessage("");
  }

  // Submit a review.
  async function handleSubmitReview(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!rating) {
      setReviewMessage("Please select a star rating.");
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewMessage("");

      const response = await submitProductReview(id, {
        rating,
        review: reviewText.trim() || null,
      });

      setReviewMessage(
        response.message || "Your review has been saved."
      );

      setEditingReview(false);

      setRating(Number(response.review.rating));
      setReviewText(response.review.review || "");

      // Refresh reviews and the customer's review.
      await fetchReviews();

      // Update product rating in local product state.
      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                average_rating: response.average_rating,
                reviews_count: response.reviews_count,
              }
            : item
        )
      );
    } catch (err) {
      console.error("Review submission failed:", err);

      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        setReviewMessage(
          Object.values(validationErrors).flat().join(" ")
        );
      } else {
        setReviewMessage(
          err.response?.data?.message ||
            "Could not save your review. Please try again."
        );
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  // Display star ratings.
  function renderStars(value, interactive = false, onChange = null) {
    const selectedRating = Number(value) || 0;

    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= selectedRating;

          if (interactive) {
            return (
              <button
                key={star}
                type="button"
                className={`review-star-button ${
                  filled ? "active" : ""
                }`}
                onClick={() => onChange(star)}
                aria-label={`Rate ${star} out of 5`}
                aria-pressed={filled}
              >
                {filled ? <FaStar /> : <FaRegStar />}
              </button>
            );
          }

          return (
            <span
              key={star}
              className={filled ? "filled" : ""}
            >
              {filled ? <FaStar /> : <FaRegStar />}
            </span>
          );
        })}
      </div>
    );
  }

  // =====================================
  // CART FUNCTIONS
  // =====================================

  function handleSizeSelection(size) {
    setSelectedSize(size);
    setQuantity(1);

    setMessage("");
    setMessageType("");
  }

  function addToCart() {
    if (!product) return;

    if (hasSizes && !selectedSizeOption) {
      setMessage("Please select a size before adding this product.");
      setMessageType("error");
      return;
    }

    const currentStock = hasSizes
      ? selectedSizeStock
      : totalStock;

    if (currentStock < 1) {
      setMessage(
        hasSizes
          ? `Size ${selectedSize} is currently out of stock.`
          : "Sorry, this product is currently out of stock."
      );

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
      (item) =>
        String(item.id) === String(product.id) &&
        String(item.selected_size || "") === String(selectedSize || "")
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

        selected_size: hasSizes ? selectedSize : null,

        selected_size_id: hasSizes
          ? selectedSizeOption.id
          : null,

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

  // =====================================
  // WHATSAPP PRODUCT SHARING
  // =====================================

 const handleWhatsAppShare = () => {
  const shareUrl = `${window.location.origin}/share/products/${product.id}`;

  const message = `Check out ${product.name} at Mega Store!`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${message}\n${shareUrl}`
  )}`;

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};
  // =====================================
  // LOADING SCREEN
  // =====================================

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

  // =====================================
  // ERROR SCREEN
  // =====================================

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

  // =====================================
  // PRODUCT NOT FOUND
  // =====================================

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

  // =====================================
  // MAIN PAGE
  // =====================================

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

        {/* =====================================
            PRODUCT SECTION
        ===================================== */}

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
              MEGA STORE COLLECTIONS
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
                ? hasSizes
                  ? `${totalStock} UNITS AVAILABLE ACROSS ALL SIZES`
                  : `${stock} UNITS AVAILABLE`
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

            {/* Size selector */}
            {hasSizes && (
              <div className="product-size-selector">
                <div className="product-size-heading">
                  <label>SELECT SIZE</label>

                  {selectedSize && (
                    <span>
                      Selected: {selectedSize}
                    </span>
                  )}
                </div>

                <div className="product-size-options">
                  {productSizes.map((sizeOption) => {
                    const sizeStock = normalizeStock(
                      sizeOption.stock_quantity
                    );

                    const isSelected =
                      String(selectedSize) === String(sizeOption.size);

                    const isAvailable = sizeStock > 0;

                    return (
                      <button
                        key={sizeOption.id}
                        type="button"
                        className={`product-size-option ${
                          isSelected ? "selected" : ""
                        } ${!isAvailable ? "unavailable" : ""}`}
                        onClick={() =>
                          isAvailable &&
                          handleSizeSelection(sizeOption.size)
                        }
                        disabled={!isAvailable}
                        aria-pressed={isSelected}
                        title={
                          isAvailable
                            ? `${sizeStock} available`
                            : "Out of stock"
                        }
                      >
                        {sizeOption.size}
                      </button>
                    );
                  })}
                </div>

                {selectedSizeOption && (
                  <p className="selected-size-stock">
                    {selectedSizeStock > 0
                      ? `${selectedSizeStock} units available in size ${selectedSize}`
                      : `Size ${selectedSize} is out of stock`}
                  </p>
                )}

                {!selectedSize && (
                  <p className="size-selection-hint">
                    Please choose your preferred size.
                  </p>
                )}
              </div>
            )}

            {/* Quantity selector */}
            {available &&
              (!hasSizes || selectedSizeOption) &&
              stock > 0 && (
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
                disabled={
                  !available ||
                  (hasSizes &&
                    (!selectedSizeOption || selectedSizeStock < 1))
                }
              >
                <FaShoppingBag />

                {!available
                  ? "SOLD OUT"
                  : hasSizes && !selectedSize
                    ? "SELECT A SIZE"
                    : "ADD TO BAG"}

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

            {/* WhatsApp share button */}
            <button
              type="button"
              className="product-whatsapp-share"
              onClick={handleWhatsAppShare}
            >
              <FaWhatsapp />
              SHARE THIS PRODUCT WITH A FRIEND
            </button>

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

        {/* =====================================
            CUSTOMER REVIEWS
        ===================================== */}

        <section className="product-reviews-section">

          {/* Review heading */}
          <div className="product-reviews-heading">
            <div>
              <p className="section-eyebrow">
                CUSTOMER FEEDBACK
              </p>

              <h2>
                RATINGS & REVIEWS<span>.</span>
              </h2>
            </div>

            <div className="reviews-summary">
              <div className="reviews-average">
                {Number(product.average_rating || 0).toFixed(1)}
              </div>

              {renderStars(product.average_rating || 0)}

              <p>
                {product.reviews_count || 0} customer reviews
              </p>
            </div>
          </div>

          {/* Review form */}
          <div
            className="product-review-form-wrapper"
            id="product-review-form"
          >

            {isAuthenticated ? (
              <form
                className="product-review-form"
                onSubmit={handleSubmitReview}
              >

                <div className="review-form-heading">
                  <div>
                    <h3>
                      {editingReview
                        ? "EDIT YOUR REVIEW"
                        : myReview
                          ? "YOUR REVIEW"
                          : "SHARE YOUR EXPERIENCE"}
                    </h3>

                    <p>
                      Tell other customers what you think about this product.
                    </p>
                  </div>

                  {myReview && !editingReview && (
                    <button
                      type="button"
                      className="edit-review-button"
                      onClick={handleEditReview}
                    >
                      <FaEdit /> EDIT REVIEW
                    </button>
                  )}
                </div>

                <label className="review-rating-label">
                  YOUR RATING
                </label>

                {renderStars(
                  rating,
                  true,
                  setRating
                )}

                <label
                  htmlFor="product-review-text"
                  className="review-comment-label"
                >
                  YOUR REVIEW (OPTIONAL)
                </label>

                <textarea
                  id="product-review-text"
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  placeholder="Share your thoughts about this product..."
                  maxLength={2000}
                  rows={5}
                />

                <div className="review-character-count">
                  {reviewText.length}/2000
                </div>

                {reviewMessage && (
                  <p
                    className="review-form-message"
                    role="status"
                  >
                    {reviewMessage}
                  </p>
                )}

                <div className="review-form-actions">

                  <button
                    type="submit"
                    className="submit-review-button"
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? "SAVING..."
                      : editingReview
                        ? "UPDATE REVIEW"
                        : "SUBMIT REVIEW"}

                    {!submittingReview && <FaArrowRight />}
                  </button>

                  {editingReview && (
                    <button
                      type="button"
                      className="cancel-review-button"
                      onClick={cancelReviewEdit}
                    >
                      CANCEL
                    </button>
                  )}

                </div>
              </form>
            ) : (
              <div className="review-login-prompt">

                <div>
                  <h3>HAVE SOMETHING TO SAY?</h3>

                  <p>
                    Log in to rate this product and share your experience.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  LOGIN TO WRITE A REVIEW <FaArrowRight />
                </button>

              </div>
            )}

          </div>

          {/* Reviews list */}
          <div className="product-reviews-list">

            <div className="reviews-list-heading">
              <h3>CUSTOMER REVIEWS</h3>

              <span>
                {product.reviews_count || 0} TOTAL
              </span>
            </div>

            {reviewsLoading ? (
              <div className="reviews-loading">
                LOADING REVIEWS...
              </div>
            ) : reviewError ? (
              <div className="reviews-empty">
                <p>{reviewError}</p>

                <button
                  type="button"
                  onClick={fetchReviews}
                >
                  TRY AGAIN
                </button>
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-empty">

                <div className="empty-review-stars">
                  <FaRegStar />
                  <FaRegStar />
                  <FaRegStar />
                  <FaRegStar />
                  <FaRegStar />
                </div>

                <h3>NO REVIEWS YET</h3>

                <p>
                  Be the first customer to review this product.
                </p>

              </div>
            ) : (
              <>
                {reviews.map((item) => {
                  const reviewerName = [
                    item.customer?.first_name,
                    item.customer?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "Customer";

                  const isOwnReview =
                    String(item.customer_id) === String(customer?.id);

                  return (
                    <article
                      className="product-review-card"
                      key={item.id}
                    >

                      <div className="review-card-top">

                        <div className="reviewer-avatar">
                          {reviewerName.charAt(0).toUpperCase()}
                        </div>

                        <div className="reviewer-information">
                          <h4>{reviewerName}</h4>

                          <span>
                            {item.created_at
                              ? new Date(
                                  item.created_at
                                ).toLocaleDateString("en-UG", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>

                        {isOwnReview && (
                          <span className="your-review-badge">
                            YOUR REVIEW
                          </span>
                        )}

                      </div>

                      {renderStars(item.rating)}

                      {item.review ? (
                        <p className="review-card-comment">
                          {item.review}
                        </p>
                      ) : (
                        <p className="review-card-no-comment">
                          No written comment provided.
                        </p>
                      )}

                      {isOwnReview && (
                        <button
                          type="button"
                          className="review-card-edit"
                          onClick={handleEditReview}
                        >
                          <FaEdit /> EDIT YOUR REVIEW
                        </button>
                      )}

                    </article>
                  );
                })}

                {/* Review pagination */}
                {reviewPagination &&
                  reviewPagination.last_page > 1 && (
                    <div className="reviews-pagination">

                      <button
                        type="button"
                        disabled={!reviewPagination.prev_page_url}
                        onClick={() =>
                          setReviewPage((page) =>
                            Math.max(1, page - 1)
                          )
                        }
                      >
                        <FaArrowLeft /> PREVIOUS
                      </button>

                      <span>
                        PAGE {reviewPagination.current_page} OF{" "}
                        {reviewPagination.last_page}
                      </span>

                      <button
                        type="button"
                        disabled={!reviewPagination.next_page_url}
                        onClick={() =>
                          setReviewPage((page) => page + 1)
                        }
                      >
                        NEXT <FaArrowRight />
                      </button>

                    </div>
                  )}
              </>
            )}

          </div>
        </section>

        {/* =====================================
            SIMILAR PRODUCTS
        ===================================== */}

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