import { useNavigate, useSearchParams } from "react-router-dom";
import { FaArrowRight, FaBolt } from "react-icons/fa";
import "./ProductCard.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Preserve the currently selected collection.
  const selectedCollection =
    searchParams.get("collection") === "ladies"
      ? "ladies"
      : "men";

  const stockQuantity = Math.max(
    0,
    Number(product.stock_quantity) || 0
  );

  const inStock = stockQuantity > 0;

  const price = Number(product.price) || 0;
  const comparePrice = Number(product.compare_at_price) || 0;

  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    comparePrice > price &&
    comparePrice > 0;

  const discountPercentage = hasDiscount
    ? Math.round(
        ((comparePrice - price) / comparePrice) * 100
      )
    : 0;

  function openProductDetails() {
    navigate(
      `/products/${product.id}?collection=${selectedCollection}`
    );
  }

  return (
    <article className="product-card">

      {/* Product image */}
      <button
        type="button"
        className="product-card-image-button"
        onClick={openProductDetails}
        aria-label={`View details for ${product.name}`}
      >
        <div className="product-image-container">

          {product.photo ? (
            <img
              src={product.photo}
              alt={product.name}
              className="product-image"
              loading="lazy"
              decoding="async"
              width="600"
              height="600"
            />
          ) : (
            <div className="product-image-placeholder">
              <span>LE.</span>
              <p>NO IMAGE AVAILABLE</p>
            </div>
          )}

          {/* Quick view overlay */}
          <div className="product-image-overlay">
            <span>
              QUICK VIEW <FaArrowRight />
            </span>
          </div>

          {/* Stock badge */}
          {!inStock && (
            <span className="product-out-of-stock">
              SOLD OUT
            </span>
          )}

          {/* Discount badge */}
          {hasDiscount && inStock && (
            <span className="product-sale-badge">
              -{discountPercentage}%
            </span>
          )}

        </div>
      </button>

      {/* Product information */}
      <div className="product-card-content">

        {/* Category and availability */}
        <div className="product-card-top">

          <p className="product-category">
            {product.category?.name || "UNCATEGORIZED"}
          </p>

          {inStock && (
            <span className="product-available-indicator">
              <FaBolt />
              AVAILABLE
            </span>
          )}

        </div>

        {/* Product name */}
        <h3 className="product-name">
          <button
            type="button"
            className="product-name-link"
            onClick={openProductDetails}
            title={product.name}
          >
            {product.name}
          </button>
        </h3>

        {/* Pricing */}
        <div className="product-pricing">

          <span className="product-price">
            {formatPrice(price)}
          </span>

          {hasDiscount && (
            <span className="product-old-price">
              {formatPrice(comparePrice)}
            </span>
          )}

        </div>

        {/* Stock information and action */}
        <div className="product-card-bottom">

          <p
            className={`product-stock ${
              inStock ? "in-stock" : "out-of-stock"
            }`}
          >
            {inStock
              ? `${stockQuantity} available`
              : "Currently unavailable"}
          </p>

          <button
            type="button"
            className="product-button"
            onClick={openProductDetails}
            disabled={!inStock}
          >
            {inStock ? (
              <>
                VIEW PRODUCT <FaArrowRight />
              </>
            ) : (
              "SOLD OUT"
            )}
          </button>

        </div>
      </div>
    </article>
  );
}

export default ProductCard;