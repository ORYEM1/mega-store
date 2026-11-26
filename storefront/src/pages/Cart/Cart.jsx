import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaShoppingBag,
  FaTrash,
  FaPlus,
  FaMinus,
  FaExclamationCircle,
} from "react-icons/fa";

import Navbar from "../../components/Navbar/Navbar";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

import "./Cart.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function Cart() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  // Authentication state.
  const token = useAuthStore((state) => state.token);

  // Cart state.
  const cart = useCartStore((state) => state.items);

  const updateQuantity = useCartStore(
    (state) => state.updateQuantity
  );

  const removeItem = useCartStore(
    (state) => state.removeItem
  );

  const clearCart = useCartStore(
    (state) => state.clearCart
  );

  // Get a unique identifier for each product-size combination.
  function getItemKey(item) {
    return item.cart_key || `${item.id}::${item.selected_size || ""}`;
  }

  // Calculate total units.
  const totalItems = cart.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  // Calculate subtotal.
  const subtotal = cart.reduce(
    (total, item) =>
      total +
      (Number(item.price) || 0) *
        (Number(item.quantity) || 0),
    0
  );

  // Check whether any cart item has an invalid quantity.
  const hasStockIssue = cart.some((item) => {
    const quantity = Number(item.quantity) || 0;
    const stock = Number(item.stock_quantity) || 0;

    return stock < 1 || quantity > stock;
  });

  // Update item quantity.
  function handleQuantityChange(item, requestedQuantity) {
    const quantity = Number(requestedQuantity);
    const stock = Number(item.stock_quantity) || 0;

    if (!Number.isInteger(quantity) || quantity < 1) {
      return;
    }

    if (stock < 1)
    {
      return;
    }

    updateQuantity(
      getItemKey(item),
      Math.min(quantity, stock)
    );
  }

  // Remove a specific product-size combination.
  function handleRemoveItem(item) {
    removeItem(getItemKey(item));
  }

  // Proceed to checkout.
  function proceedToCheckout() {
    if (cart.length === 0 || hasStockIssue) {
      return;
    }

    if (!token) {
      navigate("/login", {
        state: {
          from: {
            pathname: "/checkout",
          },
        },
      });

      return;
    }

    navigate("/checkout");
  }

  return (
    <div className="cart-page">
      <Navbar search={search} setSearch={setSearch} />

      <main className="cart-main">
        {/* Breadcrumb */}
        <div className="cart-breadcrumb">
          <Link to="/">HOME</Link>
          <span>/</span>
          <span>SHOPPING BAG</span>
        </div>

        {/* Heading */}
        <div className="cart-heading">
          <div>
            <p className="cart-eyebrow">YOUR SELECTION</p>

            <h1>
              SHOPPING <span>BAG.</span>
            </h1>

            <p className="cart-heading-description">
              {totalItems}{" "}
              {totalItems === 1 ? "ITEM" : "ITEMS"} IN YOUR BAG
            </p>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              className="cart-clear-button"
              onClick={clearCart}
            >
              <FaTrash />
              CLEAR BAG
            </button>
          )}
        </div>

        {/* Empty cart */}
        {cart.length === 0 ? (
          <section className="cart-empty">
            <div className="cart-empty-icon">
              <FaShoppingBag />
            </div>

            <p className="cart-eyebrow">NOTHING HERE YET</p>

            <h2>YOUR BAG IS EMPTY.</h2>

            <p>
              Looks like you haven't found your next favourite
              piece yet.
            </p>

            <Link to="/" className="cart-shop-button">
              START SHOPPING <FaArrowRight />
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            {/* Cart products */}
            <section className="cart-items">
              <div className="cart-items-heading">
                <h2>YOUR ITEMS</h2>
                <span>{totalItems} UNITS</span>
              </div>

              {cart.map((item) => {
                const quantity = Number(item.quantity) || 0;
                const stock = Number(item.stock_quantity) || 0;

                const outOfStock = stock < 1;

                const exceedsStock =
                  !outOfStock && quantity > stock;

                const itemKey = getItemKey(item);

                return (
                  <article
                    className="cart-item"
                    key={itemKey}
                  >
                    {/* Product image */}
                    <Link
                      to={`/products/${item.id}`}
                      className="cart-item-image"
                    >
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                        />
                      ) : (
                        <div className="cart-item-no-image">
                          <span>AC.</span>
                          <p>NO IMAGE</p>
                        </div>
                      )}
                    </Link>

                    {/* Product information */}
                    <div className="cart-item-details">
                      <p className="cart-item-category">
                        {item.category?.name || "COLLECTION"}
                      </p>

                      <Link
                        to={`/products/${item.id}`}
                        className="cart-item-name"
                      >
                        {item.name}
                      </Link>

                      {/* Selected size */}
                      {item.selected_size && (
                        <p className="cart-item-size">
                          SIZE: <strong>{item.selected_size}</strong>
                        </p>
                      )}

                      <p className="cart-item-unit-price">
                        {formatPrice(item.price)} <span>/ EACH</span>
                      </p>

                      {/* Stock warnings */}
                      {outOfStock && (
                        <p className="cart-stock-warning">
                          <FaExclamationCircle />
                          CURRENTLY OUT OF STOCK
                        </p>
                      )}

                      {exceedsStock && (
                        <p className="cart-stock-warning">
                          <FaExclamationCircle />
                          ONLY {stock} AVAILABLE. REDUCE QUANTITY.
                        </p>
                      )}

                      {/* Quantity and remove */}
                      <div className="cart-item-actions">
                        <div className="cart-quantity">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(
                                item,
                                quantity - 1
                              )
                            }
                            disabled={quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <FaMinus />
                          </button>

                          <span>{quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              handleQuantityChange(
                                item,
                                quantity + 1
                              )
                            }
                            disabled={
                              outOfStock || quantity >= stock
                            }
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <FaPlus />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cart-remove-button"
                          onClick={() => handleRemoveItem(item)}
                        >
                          <FaTrash />
                          REMOVE
                        </button>
                      </div>
                    </div>

                    {/* Item total */}
                    <div className="cart-item-total">
                      {formatPrice(
                        Number(item.price) * quantity
                      )}
                    </div>
                  </article>
                );
              })}

              <Link to="/" className="cart-continue-link">
                <FaArrowLeft />
                CONTINUE SHOPPING
              </Link>
            </section>

            {/* Order summary */}
            <aside className="cart-summary">
              <p className="cart-eyebrow">YOUR ORDER</p>

              <h2>ORDER SUMMARY.</h2>

              <div className="cart-summary-row">
                <span>ITEMS</span>
                <span>{totalItems}</span>
              </div>

              <div className="cart-summary-row">
                <span>SUBTOTAL</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="cart-summary-row cart-summary-total">
                <span>TOTAL</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <p className="cart-shipping-note">
                Delivery charges, if applicable, will be confirmed
                during checkout.
              </p>

              {hasStockIssue && (
                <p className="cart-summary-warning">
                  <FaExclamationCircle />
                  Please resolve the stock issues before checkout.
                </p>
              )}

              <button
                type="button"
                className="cart-checkout-button"
                onClick={proceedToCheckout}
                disabled={hasStockIssue}
              >
                PROCEED TO CHECKOUT <FaArrowRight />
              </button>

              <Link to="/" className="cart-summary-continue">
                CONTINUE SHOPPING
              </Link>

              <div className="cart-secure-note">
                <FaShoppingBag />
                <span>THANK YOU FOR SHOPPING WITH LIVING EARTH APPARELS.</span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default Cart;