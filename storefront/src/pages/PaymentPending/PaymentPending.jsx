import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaMobileAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

import { checkPaymentStatus } from "../../services/api";
import { useCartStore } from "../../store/cartStore";

import "./PaymentPending.css";

function PaymentPending() {
  const navigate = useNavigate();

  const clearCart = useCartStore((state) => state.clearCart);

  const [order, setOrder] = useState(null);
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  const [message, setMessage] = useState(
    "Please approve the payment request on your phone."
  );

  // Prevent overlapping requests.
  const inFlight = useRef(false);

  // Prevent additional checks after a final payment result.
  const terminal = useRef(false);

  // Store the payment checker so the button can trigger it.
  const checkPaymentRef = useRef(null);

  const referenceId =
    order?.payment?.reference_id ?? order?.reference_id;

  // Recover pending order.
  useEffect(() => {
    const savedOrder =
      localStorage.getItem("pending_payment_order") ||
      sessionStorage.getItem("pending_payment_order");

    if (!savedOrder) {
      navigate("/checkout", { replace: true });
      return;
    }

    try {
      const parsedOrder = JSON.parse(savedOrder);

      setOrder(parsedOrder);
    } catch (error) {
      console.error("Could not recover pending order:", error);

      localStorage.removeItem("pending_payment_order");
      sessionStorage.removeItem("pending_payment_order");

      navigate("/checkout", { replace: true });
    }
  }, [navigate]);

  // Monitor payment status.
  useEffect(() => {
    if (!referenceId || !order) return;

    let active = true;

    async function verifyPayment() {
      if (inFlight.current || terminal.current) {
        return;
      }

      inFlight.current = true;
      setChecking(true);

      try {
        const result = await checkPaymentStatus(referenceId);

        if (!active) return;

        // PAYMENT SUCCESSFUL.
        if (result.payment_status === "paid") {
          terminal.current = true;

          clearCart();

          const successfulOrder = {
            ...order,
            payment_status: "paid",
          };

          sessionStorage.setItem(
            "last_order",
            JSON.stringify(successfulOrder)
          );

          localStorage.removeItem("pending_payment_order");
          sessionStorage.removeItem("pending_payment_order");

          setPaymentStatus("paid");
          setMessage("Your payment has been confirmed.");

          navigate("/order-success", {
            replace: true,
          });

          return;
        }

        // PAYMENT FAILED.
        if (result.payment_status === "failed") {
          terminal.current = true;

          setPaymentStatus("failed");

          setMessage(
            result.message ||
              "Your payment was unsuccessful. Please contact support before attempting another payment."
          );

          return;
        }

        // PAYMENT STILL PENDING.
        setPaymentStatus("pending");

        setMessage(
          "Your payment request is still being processed. Please approve it on your phone."
        );
      } catch (error) {
        if (!active) return;

        console.error("Payment verification failed:", error);

        setMessage(
          error.response?.data?.message ||
            "We could not verify your payment right now. We will try again."
        );
      } finally {
        inFlight.current = false;

        if (active) {
          setChecking(false);
        }
      }
    }

    // Make the checker available to the manual button.
    checkPaymentRef.current = verifyPayment;

    // Check immediately.
    verifyPayment();

    // Automatically check every 10 seconds.
    const timer = setInterval(verifyPayment, 10000);

    return () => {
      active = false;

      clearInterval(timer);

      checkPaymentRef.current = null;
    };
  }, [referenceId, order, clearCart, navigate]);

  // Wait while recovering the order.
  if (!order) {
    return null;
  }

  const orderNumber =
    order.order?.order_number ??
    order.order_number ??
    order.order?.orders_id ??
    order.orders_id ??
    order.id;

  const amount =
    order.payment?.amount ??
    order.order?.total ??
    order.total;

  const currency =
    order.payment?.currency ?? "UGX";

  return (
    <main className="payment-pending-page">
      <section className="payment-pending-card">

        <div className="payment-pending-icon">
          {paymentStatus === "failed" ? (
            <FaExclamationCircle />
          ) : (
            <FaMobileAlt />
          )}
        </div>

        <h1>
          {paymentStatus === "failed"
            ? "Payment Unsuccessful"
            : "Waiting for Payment"}
        </h1>

        <p className="payment-pending-message">
          {message}
        </p>

        {orderNumber && (
          <div className="payment-pending-reference">
            <span>Order Reference</span>
            <strong>{orderNumber}</strong>
          </div>
        )}

        {amount && (
          <div className="payment-pending-amount">
            <span>Payment Amount</span>

            <strong>
              {currency}{" "}
              {Number(amount).toLocaleString("en-UG")}
            </strong>
          </div>
        )}

        {paymentStatus === "paid" ? (
          <div className="payment-confirmed">
            <FaCheckCircle />
            Payment confirmed!
          </div>
        ) : (
          <>
            {paymentStatus === "pending" && (
              <div className="payment-processing">
                <span className="payment-spinner"></span>

                <span>
                  {checking
                    ? "Checking payment..."
                    : "Waiting for confirmation"}
                </span>
              </div>
            )}

            {paymentStatus === "failed" && (
              <div className="payment-failed">
                Your payment was not completed.
              </div>
            )}

            <button
              type="button"
              className="payment-check-button"
              onClick={() => checkPaymentRef.current?.()}
              disabled={checking || paymentStatus === "failed"}
            >
              {checking
                ? "CHECKING..."
                : "CHECK PAYMENT STATUS"}
            </button>
          </>
        )}

        <div className="payment-pending-actions">
          <Link to="/" className="payment-home-link">
            Back to Shopping
          </Link>
        </div>

        <p className="payment-pending-note">
          Do not make another payment while this transaction
          is being verified.
        </p>

      </section>
    </main>
  );
}

export default PaymentPending;