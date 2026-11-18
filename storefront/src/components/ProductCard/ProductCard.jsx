import { useNavigate } from "react-router-dom";
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

  const stockQuantity = Number(product.stock_quantity) || 0;
  const inStock = stockQuantity > 0;

  const price = Number(product.price) || 0;
  const comparePrice = Number(product.compare_at_price) || 0;



  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    comparePrice > price &&
    comparePrice > 0;

  const discountPercentage = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  

  function openProductDetails() {
    navigate(`/products/${product.id}`);
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
              <span>AC.</span>
              <p>NO IMAGE AVAILABLE</p>
            </div>
          )}

          <div className="product-image-overlay">
            <span>
              QUICK VIEW <FaArrowRight />
            </span>
          </div>

          {!inStock && (
            <span className="product-out-of-stock">
              SOLD OUT
            </span>
          )}

          {hasDiscount && inStock && (
            <span className="product-sale-badge">
              -{discountPercentage}%
            </span>
          )}
        </div>
      </button>

      {/* Product information */}
      <div className="product-card-content">
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
            {formatPrice(product.price)}
          </span>

          {hasDiscount && (
            <span className="product-old-price">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        {/* Stock information */}
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