import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./OrderSuccess.css";

function OrderSuccess() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const savedOrder = sessionStorage.getItem("last_order");

    if (!savedOrder) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const parsedOrder = JSON.parse(savedOrder);
      setOrder(parsedOrder);
    } catch (error) {
      console.error("Failed to read order details:", error);
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!order) {
    return null;
  }

  const orderNumber =
    order.order?.order_number ??
    order.order_number ??
    order.order?.id ??
    order.id;

  return (
    <main className="order-success-page">
      <section className="success-card">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>

        <p className="success-message">
          Thank you for shopping with us. Your order has been submitted
          successfully.
        </p>

        {orderNumber && (
          <div className="order-reference">
            <span>Order Reference</span>
            <strong>{orderNumber}</strong>
          </div>
        )}

        <p className="success-note">
          Please keep your order reference for future enquiries.
        </p>

        <div className="success-actions">
          <Link to="/" className="continue-shopping">
            Continue Shopping
          </Link>

          <button
            type="button"
            className="home-button"
            onClick={() => {
              sessionStorage.removeItem("last_order");
              navigate("/");
            }}
          >
            Back to Home
          </button>
        </div>
      </section>
    </main>
  );
}

export default OrderSuccess;