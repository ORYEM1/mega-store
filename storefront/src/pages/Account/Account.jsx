import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUserCircle,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaArrowRight,
  FaArrowLeft,
  FaSignOutAlt,
  FaBoxOpen,
  FaCreditCard,
  FaSpinner,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

import Navbar from "../../components/Navbar/Navbar";

import {
  getAuthenticatedCustomer,
  getCustomerOrders,
  getCustomerOrder,
  logoutCustomer,
} from "../../services/api";

import { useAuthStore } from "../../store/authStore";

import "./Account.css";

function formatPrice(price) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  return new Date(date).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  const value = String(status || "pending").toLowerCase();

  if (
    ["paid", "delivered", "completed", "success", "successful"].includes(value)
  ) {
    return "status-success";
  }

  if (["failed", "cancelled", "canceled", "rejected"].includes(value)) {
    return "status-danger";
  }

  if (
    ["processing", "shipped", "out_for_delivery", "confirmed"].includes(value)
  ) {
    return "status-progress";
  }

  return "status-pending";
}

function StatusBadge({ status }) {
  const value = String(status || "pending").replaceAll("_", " ");

  const className = getStatusClass(status);

  return (
    <span className={`account-status-badge ${className}`}>
      {value}
    </span>
  );
}

function getProductImage(product) {
  const image = product?.photo || product?.image || product?.thumbnail;

  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    "http://192.168.10.246:8000/api";

  const serverUrl = apiUrl.replace(/\/api\/?$/, "");

  if (image.startsWith("/")) {
    return `${serverUrl}${image}`;
  }

  return `${serverUrl}/storage/${image}`;
}

function Account() {
  const navigate = useNavigate();

  const customer = useAuthStore((state) => state.customer);
  const token = useAuthStore((state) => state.token);
  const setCustomer = useAuthStore((state) => state.setCustomer);

  const [activeTab, setActiveTab] = useState("orders");

  const [profile, setProfile] = useState(customer || {});

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  const [loggingOut, setLoggingOut] = useState(false);

  // Load customer profile and order history.
  useEffect(() => {
    if (!token) {
      navigate("/login", {
        replace: true,
        state: {
          from: { pathname: "/account" },
        },
      });

      return;
    }

    loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadAccount() {
    setLoading(true);
    setError("");

    try {
      const [customerResponse, ordersResponse] = await Promise.all([
        getAuthenticatedCustomer(),
        getCustomerOrders(1),
      ]);

      const customerData =
        customerResponse?.customer ||
        customerResponse?.data?.customer ||
        customerResponse?.data ||
        customerResponse;

      if (customerData && typeof customerData === "object") {
        setProfile(customerData);
        setCustomer(customerData);
      }

      const paginator = ordersResponse?.orders;

      setOrders(
        Array.isArray(paginator)
          ? paginator
          : paginator?.data || []
      );

      setPagination(
        Array.isArray(paginator) ? null : paginator
      );
    } catch (err) {
      console.error("Could not load account:", err);

      setError(
        err.response?.data?.message ||
          "We could not load your account information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Load another page of orders.
  async function loadMoreOrders() {
    if (!pagination?.next_page_url || loadingMore) return;

    setLoadingMore(true);

    try {
      const nextPage = Number(pagination.current_page || 1) + 1;
      const response = await getCustomerOrders(nextPage);

      const paginator = response?.orders;
      const nextOrders = Array.isArray(paginator)
        ? paginator
        : paginator?.data || [];

      setOrders((current) => [...current, ...nextOrders]);

      setPagination(
        Array.isArray(paginator) ? null : paginator
      );
    } catch (err) {
      console.error("Could not load more orders:", err);
      setError("Could not load more orders. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  // Expand an order and load its full details.
  async function toggleOrder(order) {
    const orderId = order.orders_id || order.id;

    if (expandedOrder?.orders_id === orderId || expandedOrder?.id === orderId) {
      setExpandedOrder(null);
      return;
    }

    setLoadingOrderId(orderId);

    try {
      const response = await getCustomerOrder(orderId);

      setExpandedOrder(response?.order || response);
    } catch (err) {
      console.error("Could not load order details:", err);

      // The order list already includes its items.
      setExpandedOrder(order);
    } finally {
      setLoadingOrderId(null);
    }
  }

  // Log out.
  async function handleLogout() {
    setLoggingOut(true);

    try {
      await logoutCustomer();
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoggingOut(false);
      navigate("/", { replace: true });
    }
  }

  const firstName =
    profile.first_name ||
    profile.name?.split(" ")[0] ||
    "Customer";

  const fullName =
    [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(" ") ||
    profile.name ||
    "Customer";

  const totalOrders =
    pagination?.total ?? orders.length;

  const paidOrders = orders.filter(
    (order) =>
      ["paid", "success", "successful"].includes(
        String(order.payment_status || "").toLowerCase()
      )
  ).length;

  if (!token) {
    return (
      <div className="account-page">
        <Navbar />
        <div className="account-loading">
          REDIRECTING TO LOGIN...
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <Navbar />

      <main className="account-main">
        <nav className="account-breadcrumb">
          <Link to="/">HOME</Link>
          <span>/</span>
          <span>MY ACCOUNT</span>
        </nav>

        <header className="account-heading">
          <div>
            <p className="account-eyebrow">YOUR PERSONAL SPACE</p>
            <h1>
              MY <span>ACCOUNT.</span>
            </h1>
            <p>Manage your profile and keep track of your orders.</p>
          </div>

          <button
            type="button"
            className="account-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <FaSignOutAlt />
            {loggingOut ? "LOGGING OUT..." : "LOG OUT"}
          </button>
        </header>

        {error && (
          <div className="account-error" role="alert">
            <FaExclamationCircle />
            <span>{error}</span>

            <button type="button" onClick={loadAccount}>
              TRY AGAIN
            </button>
          </div>
        )}

        {loading ? (
          <div className="account-loading">
            <FaSpinner className="account-spinner" />
            <p>LOADING YOUR ACCOUNT...</p>
          </div>
        ) : (
          <div className="account-layout">
            {/* Account sidebar */}
            <aside className="account-sidebar">
              <div className="account-user-card">
                <div className="account-avatar">
                  <FaUserCircle />
                </div>

                <div>
                  <p>WELCOME BACK</p>
                  <h2>{firstName}</h2>
                  <span>{profile.email || "Customer account"}</span>
                </div>
              </div>

              <nav className="account-sidebar-nav">
                <button
                  type="button"
                  className={activeTab === "orders" ? "active" : ""}
                  onClick={() => setActiveTab("orders")}
                >
                  <FaShoppingBag />
                  MY ORDERS
                  <FaArrowRight className="account-nav-arrow" />
                </button>

                <button
                  type="button"
                  className={activeTab === "profile" ? "active" : ""}
                  onClick={() => setActiveTab("profile")}
                >
                  <FaUserCircle />
                  MY PROFILE
                  <FaArrowRight className="account-nav-arrow" />
                </button>
              </nav>

              <Link to="/" className="account-continue-shopping">
                <FaArrowLeft />
                CONTINUE SHOPPING
              </Link>
            </aside>

            {/* Account content */}
            <section className="account-content">
              {activeTab === "orders" ? (
                <>
                  <div className="account-section-heading">
                    <div>
                      <p className="account-eyebrow">PURCHASE HISTORY</p>
                      <h2>MY ORDERS.</h2>
                    </div>

                    <span className="account-order-count">
                      {totalOrders} {totalOrders === 1 ? "ORDER" : "ORDERS"}
                    </span>
                  </div>

                  <div className="account-stats">
                    <div className="account-stat-card">
                      <span><FaShoppingBag /></span>
                      <div>
                        <strong>{totalOrders}</strong>
                        <small>TOTAL ORDERS</small>
                      </div>
                    </div>

                    <div className="account-stat-card">
                      <span><FaCheckCircle /></span>
                      <div>
                        <strong>{paidOrders}</strong>
                        <small>PAID ORDERS</small>
                      </div>
                    </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="account-empty-orders">
                      <FaBoxOpen />

                      <h3>NO ORDERS YET.</h3>

                      <p>
                        Your shopping journey starts here.
                        Explore our collection and place your first order.
                      </p>

                      <Link to="/" className="account-shop-button">
                        START SHOPPING <FaArrowRight />
                      </Link>
                    </div>
                  ) : (
                    <div className="account-orders-list">
                      {orders.map((order) => {
                        const orderId =
                          order.orders_id || order.id;

                        const orderItems = order.items || [];

                        const isExpanded =
                          expandedOrder &&
                          (expandedOrder.orders_id === orderId ||
                            expandedOrder.id === orderId);

                        const orderNumber =
                          order.order_number || `#${orderId}`;

                        return (
                          <article
                            className={`account-order-card ${
                              isExpanded ? "expanded" : ""
                            }`}
                            key={orderId}
                          >
                            <div className="account-order-top">
                              <div>
                                <span className="account-order-label">
                                  ORDER REFERENCE
                                </span>

                                <h3>{orderNumber}</h3>
                              </div>

                              <StatusBadge status={order.status} />
                            </div>

                            <div className="account-order-meta">
                              <span>
                                <FaCalendarAlt />
                                {formatDate(order.created_at)}
                              </span>

                              <span>
                                <FaCreditCard />
                                {String(order.payment_method || "N/A").replaceAll("_", " ")}
                              </span>

                              <span>
                                <FaBoxOpen />
                                {orderItems.length}{" "}
                                {orderItems.length === 1 ? "ITEM" : "ITEMS"}
                              </span>
                            </div>

                            <div className="account-order-preview">
                              {orderItems.slice(0, 3).map((item, index) => {
                                const image = getProductImage(item.product);

                                return (
                                  <div
                                    className="account-order-preview-item"
                                    key={item.id || `${item.product_id}-${index}`}
                                  >
                                    {image ? (
                                      <img
                                        src={image}
                                        alt={item.product?.name || item.product_name || "Product"}
                                        onError={(event) => {
                                          event.currentTarget.style.display = "none";
                                        }}
                                      />
                                    ) : (
                                      <div className="account-order-image-placeholder">
                                        <FaShoppingBag />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {orderItems.length > 3 && (
                                <span className="account-more-items">
                                  +{orderItems.length - 3}
                                </span>
                              )}

                              <div className="account-order-total">
                                <small>ORDER TOTAL</small>
                                <strong>{formatPrice(order.total)}</strong>
                              </div>
                            </div>

                            <div className="account-order-bottom">
                              <div className="account-payment-status">
                                <span>PAYMENT:</span>
                                <StatusBadge status={order.payment_status} />
                              </div>

                              <button
                                type="button"
                                className="account-view-order"
                                onClick={() => toggleOrder(order)}
                                disabled={loadingOrderId === orderId}
                              >
                                {loadingOrderId === orderId ? (
                                  <>
                                    <FaSpinner className="account-spinner" />
                                    LOADING...
                                  </>
                                ) : isExpanded ? (
                                  <>
                                    HIDE DETAILS <FaChevronUp />
                                  </>
                                ) : (
                                  <>
                                    VIEW DETAILS <FaChevronDown />
                                  </>
                                )}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="account-order-details">
                                <h4>ORDER DETAILS</h4>

                                {(expandedOrder.items || []).map((item, index) => {
                                  const product = item.product || {};
                                  const image = getProductImage(product);

                                  return (
                                    <div
                                      className="account-detail-product"
                                      key={item.id || `${item.product_id}-${index}`}
                                    >
                                      {image ? (
                                        <img
                                          src={image}
                                          alt={product.name || item.product_name || "Product"}
                                        />
                                      ) : (
                                        <div className="account-detail-image-placeholder">
                                          <FaShoppingBag />
                                        </div>
                                      )}

                                      <div className="account-detail-product-info">
                                        <strong>
                                          {product.name ||
                                            item.product_name ||
                                            "Product"}
                                        </strong>

                                        {item.size && (
                                          <small>SIZE: {item.size}</small>
                                        )}

                                        <small>QUANTITY: {item.quantity}</small>
                                      </div>

                                      <strong className="account-detail-price">
                                        {formatPrice(item.subtotal)}
                                      </strong>
                                    </div>
                                  );
                                })}

                                <div className="account-detail-summary">
                                  <div>
                                    <span>SUBTOTAL</span>
                                    <strong>{formatPrice(expandedOrder.subtotal)}</strong>
                                  </div>

                                  <div>
                                    <span>TOTAL</span>
                                    <strong>{formatPrice(expandedOrder.total)}</strong>
                                  </div>
                                </div>

                                <div className="account-delivery-address">
                                  <FaMapMarkerAlt />
                                  <div>
                                    <strong>DELIVERY ADDRESS</strong>
                                    <p>
                                      {expandedOrder.shipping_address ||
                                        "No delivery address available."}
                                    </p>
                                  </div>
                                </div>

                                {expandedOrder.notes && (
                                  <div className="account-order-notes">
                                    <strong>ORDER NOTES</strong>
                                    <p>{expandedOrder.notes}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })}

                      {pagination?.next_page_url && (
                        <button
                          type="button"
                          className="account-load-more"
                          onClick={loadMoreOrders}
                          disabled={loadingMore}
                        >
                          {loadingMore ? (
                            <>
                              <FaSpinner className="account-spinner" />
                              LOADING...
                            </>
                          ) : (
                            "LOAD MORE ORDERS"
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="account-section-heading">
                    <div>
                      <p className="account-eyebrow">PERSONAL INFORMATION</p>
                      <h2>MY PROFILE.</h2>
                    </div>
                  </div>

                  <div className="account-profile-card">
                    <div className="account-profile-avatar">
                      <FaUserCircle />
                    </div>

                    <div>
                      <h3>{fullName}</h3>
                      <p>LIVING EARTH APPARELS CUSTOMER</p>
                    </div>
                  </div>

                  <div className="account-profile-details">
                    <div className="account-profile-field">
                      <span><FaUserCircle /> FULL NAME</span>
                      <strong>{fullName}</strong>
                    </div>

                    <div className="account-profile-field">
                      <span><FaEnvelope /> EMAIL ADDRESS</span>
                      <strong>{profile.email || "Not provided"}</strong>
                    </div>

                    <div className="account-profile-field">
                      <span><FaPhone /> PHONE NUMBER</span>
                      <strong>
                        {profile.phone ||
                          profile.phone_number ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="account-profile-field">
                      <span><FaMapMarkerAlt /> ADDRESS</span>
                      <strong>
                        {profile.address ||
                          profile.shipping_address ||
                          "No saved address"}
                      </strong>
                    </div>

                    <div className="account-profile-field">
                      <span><FaCalendarAlt /> MEMBER SINCE</span>
                      <strong>{formatDate(profile.created_at)}</strong>
                    </div>
                  </div>

                  <div className="account-profile-notice">
                    <FaExclamationCircle />
                    <p>
                      Your profile information is displayed from your
                      registered customer account. Profile editing will
                      be available when the customer profile update API
                      is connected.
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default Account;