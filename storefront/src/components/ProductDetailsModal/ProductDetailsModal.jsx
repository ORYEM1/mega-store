import { useEffect } from "react";
import "./ProductDetailsModal.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function ProductDetailsModal({ product, onClose }) {
  useEffect(() => {
    if (!product) return;

    // Prevent the background page from scrolling.
    document.body.style.overflow = "hidden";

    // Close the modal using Escape.
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="product-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
      >
        <button
          type="button"
          className="product-modal-close"
          onClick={onClose}
          aria-label="Close product details"
        >
          &times;
        </button>

        <div className="product-modal-layout">
          {/* Product image */}
          <div className="product-modal-image-container">
            {product.photo ? (
              <img
                src={product.photo}
                alt={product.name}
                className="product-modal-image"
              />
            ) : (
              <div className="product-modal-no-image">
                No image available
              </div>
            )}
          </div>

          {/* Product information */}
          <div className="product-modal-content">
            {product.category && (
              <p className="product-modal-category">
                {product.category.name}
              </p>
            )}

            <h2 id="product-modal-title">{product.name}</h2>

            {product.sku && (
              <p className="product-modal-sku">
                Product code: {product.sku}
              </p>
            )}

            <div className="product-modal-pricing">
              <span className="product-modal-price">
                {formatPrice(product.price)}
              </span>

              {product.compare_at_price &&
                Number(product.compare_at_price) >
                  Number(product.price) && (
                  <span className="product-modal-old-price">
                    {formatPrice(product.compare_at_price)}
                  </span>
                )}
            </div>

            <p
              className={`product-modal-stock ${
                product.in_stock ? "available" : "unavailable"
              }`}
            >
              {product.in_stock
                ? `${product.stock_quantity} available`
                : "Currently out of stock"}
            </p>

            <div className="product-modal-description">
              <h3>Product Description</h3>

              <p>
                {product.description ||
                  "No description is available for this product yet."}
              </p>
            </div>

            <button
              type="button"
              className="product-modal-continue"
              onClick={onClose}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsModal;