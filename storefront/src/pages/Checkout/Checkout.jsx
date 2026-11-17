import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  GoogleMap,
  Marker,
  Autocomplete,
  useJsApiLoader,
} from "@react-google-maps/api";

import {
  FaArrowLeft,
  FaArrowRight,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaMobileAlt,
  FaUniversity,
  FaCreditCard,
  FaExclamationCircle,
  FaShoppingBag,
  FaLocationArrow,
} from "react-icons/fa";

import Navbar from "../../components/Navbar/Navbar";
import { createOrder } from "../../services/api";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

import "./Checkout.css";

// Google Maps configuration.
const GOOGLE_MAPS_LIBRARIES = ["places"];

const DEFAULT_MAP_CENTER = {
  lat: 0.3136,
  lng: 32.5811,
};

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "350px",
};

// Format Ugandan currency.
function formatPrice(price) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);
}

// Normalize Ugandan phone numbers to 2567XXXXXXXX.
function normalizeUgandanPhone(phone) {
  const cleaned = phone.replace(/[\s-]/g, "");

  if (/^07\d{8}$/.test(cleaned)) {
    return `256${cleaned.substring(1)}`;
  }

  if (/^2567\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^\+2567\d{8}$/.test(cleaned)) {
    return cleaned.substring(1);
  }

  return null;
}

// Convert latitude and longitude into a readable address.
function reverseGeocode(lat, lng) {
  return new Promise((resolve, reject) => {
    if (!window.google?.maps) {
      reject(new Error("Google Maps is not available."));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode(
      {
        location: { lat, lng },
      },
      (results, status) => {
        if (status === "OK" && results?.length) {
          resolve(results[0].formatted_address);
        } else {
          reject(
            new Error("Could not retrieve an address for this location.")
          );
        }
      }
    );
  });
}

function Checkout() {
  const navigate = useNavigate();

  // Authentication.
  const token = useAuthStore((state) => state.token);

  // Cart.
  const cart = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Google Maps loader.
  const {
    isLoaded: isMapLoaded,
    loadError: mapLoadError,
  } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // References.
  const autocompleteRef = useRef(null);

  // Track whether the customer manually changed the address.
  const addressEditedRef = useRef(false);

  // Navigation search.
  const [search, setSearch] = useState("");

  // Checkout form.
  const [form, setForm] = useState({
    shipping_address: "",
    payment_method: "cash",
    mobile_money_provider: "",
    mobile_money_phone: "",
    notes: "",
  });

  // Map and location state.
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [location, setLocation] = useState(null);

  const [locationStatus, setLocationStatus] = useState(
    "Waiting for Google Maps..."
  );

  const [locating, setLocating] = useState(false);

  // Submission state.
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Calculate subtotal.
  const subtotal = cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  // Check stock availability.
  const hasStockIssue = cart.some((item) => {
    const quantity = Number(item.quantity) || 0;
    const stock = Number(item.stock_quantity) || 0;

    return stock < 1 || quantity > stock;
  });

  // Redirect unauthenticated customers.
  useEffect(() => {
    if (!token) {
      navigate("/login", {
        replace: true,
        state: {
          from: {
            pathname: "/checkout",
          },
        },
      });
    }
  }, [token, navigate]);

  // Update the selected location.
  const selectLocation = useCallback(async (lat, lng) => {
    setLocation({ lat, lng });
    setMapCenter({ lat, lng });

    try {
      const address = await reverseGeocode(lat, lng);

      if (!addressEditedRef.current) {
        setForm((current) => ({
          ...current,
          shipping_address: address,
        }));
      }

      setLocationStatus("Delivery location selected successfully.");
    } catch (err) {
      console.error("Reverse geocoding failed:", err);

      setLocationStatus(
        "Location selected, but its address could not be retrieved."
      );
    }
  }, []);

  // Detect the device's current location.
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Your browser does not support location detection."
      );
      return;
    }

    setLocating(true);
    setLocationStatus("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        addressEditedRef.current = false;

        await selectLocation(lat, lng);

        setLocating(false);
      },
      (err) => {
        console.error("Location detection failed:", err);

        const messages = {
          1: "Location permission denied. Please enter your address manually.",
          2: "Your current location is unavailable. Try again or enter your address.",
          3: "Location request timed out. Please try again.",
        };

        setLocationStatus(
          messages[err.code] ||
            "Unable to detect your location. Enter your address manually."
        );

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, [selectLocation]);

  // Automatically request location after Google Maps loads.
  useEffect(() => {
    if (token && isMapLoaded) {
      handleUseCurrentLocation();
    }
  }, [token, isMapLoaded, handleUseCurrentLocation]);

  // Handle form changes.
  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "shipping_address") {
      addressEditedRef.current = true;
      setLocation(null);

      setLocationStatus(
        "Address entered manually. Select a Google Maps suggestion or map location to attach coordinates."
      );
    }

    // Reset the network and phone number when changing
    // away from Mobile Money.
    if (name === "payment_method" && value !== "mobile_money") {
      setForm((current) => ({
        ...current,
        payment_method: value,
        mobile_money_provider: "",
        mobile_money_phone: "",
      }));

      setError("");
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  // Handle Google Maps autocomplete selection.
  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace();

    if (!place?.geometry?.location) {
      setError(
        "Please select a valid address from the Google Maps suggestions."
      );
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    addressEditedRef.current = false;

    setForm((current) => ({
      ...current,
      shipping_address:
        place.formatted_address ||
        place.name ||
        current.shipping_address,
    }));

    setLocation({ lat, lng });
    setMapCenter({ lat, lng });

    setLocationStatus("Google Maps address selected successfully.");
    setError("");
  }

  // Handle clicking on the map.
  function handleMapClick(event) {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    addressEditedRef.current = false;

    selectLocation(lat, lng);
    setError("");
  }

  // Handle dragging the map marker.
  function handleMarkerDrag(event) {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    addressEditedRef.current = false;

    selectLocation(lat, lng);
  }

  // Submit order.
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

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

    if (cart.length === 0) {
      setError(
        "Your cart is empty. Add products before checking out."
      );
      return;
    }

    if (hasStockIssue) {
      setError(
        "Some products have insufficient stock. Please review your cart."
      );
      return;
    }

    if (!form.shipping_address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    // Validate Mobile Money selection.
    let normalizedPhone = null;

    if (form.payment_method === "mobile_money") {
      // Ensure a payment provider is selected.
      if (
        !["mtn_momo", "airtel_money"].includes(
          form.mobile_money_provider
        )
      ) {
        setError("Please select MTN MoMo or Airtel Money.");
        return;
      }

      // Airtel Money integration is not available yet.
      if (form.mobile_money_provider === "airtel_money") {
        setError(
          "Airtel Money is coming soon. Please select MTN MoMo."
        );
        return;
      }

      // Normalize and validate the phone number.
      normalizedPhone = normalizeUgandanPhone(
        form.mobile_money_phone
      );

      if (!normalizedPhone) {
        setError(
          "Please enter a valid Ugandan phone number, e.g. 0772123456."
        );
        return;
      }
    }

   // Prepare cart items, including selected sizes.
    const items = cart.map((item) => ({
      product_id: item.id,
      size: item.selected_size || null,
      quantity: Number(item.quantity),
    }));

    // Prepare order data.
    const orderData = {
      items,

      shipping_address: form.shipping_address.trim(),

      payment_method: form.payment_method,

      mobile_money_provider:
        form.payment_method === "mobile_money"
          ? form.mobile_money_provider
          : null,

      mobile_money_phone: normalizedPhone,

      notes: form.notes.trim() || null,

      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
    };

    try {
      setSubmitting(true);

      const response = await createOrder(orderData);

      // MOBILE MONEY PAYMENT.
      if (form.payment_method === "mobile_money") {
        const referenceId = response.payment?.reference_id;

        // Save the pending order in both browser storages.
        sessionStorage.setItem(
          "pending_payment_order",
          JSON.stringify(response)
        );

        localStorage.setItem(
          "pending_payment_order",
          JSON.stringify(response)
        );

        if (!referenceId) {
          setError(
            "Your order was created, but no payment reference was returned. Please contact support."
          );
          return;
        }

        // The PaymentPending page will monitor payment status.
        navigate("/payment-pending", {
          replace: true,
        });

        return;
      }

      // CASH AND OTHER EXISTING PAYMENT METHODS.
      clearCart();

      sessionStorage.setItem(
        "last_order",
        JSON.stringify(response)
      );

      navigate("/order-success", {
        replace: true,
      });
    } catch (err) {
      console.error("Order submission failed:", err);

      const responseData = err.response?.data;

      if (responseData?.errors) {
        const validationMessages = Object.values(
          responseData.errors
        ).flat();

        setError(
          validationMessages.join(" ") ||
            "Please check your order details."
        );
      } else {
        setError(
          responseData?.message ||
            err.message ||
            "We could not place your order. Please check your connection and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Redirecting state.
  if (!token) {
    return (
      <div className="checkout-page">
        <Navbar search={search} setSearch={setSearch} />

        <div className="checkout-message">
          REDIRECTING YOU TO LOGIN...
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar search={search} setSearch={setSearch} />

      <main className="checkout-main">
        {/* Breadcrumb */}
        <nav
          className="checkout-breadcrumb"
          aria-label="Breadcrumb"
        >
          <Link to="/">HOME</Link>
          <span>/</span>
          <Link to="/cart">SHOPPING BAG</Link>
          <span>/</span>
          <span>CHECKOUT</span>
        </nav>

        {/* Heading */}
        <header className="checkout-heading">
          <p className="checkout-eyebrow">ALMOST THERE</p>

          <h1>
            CHECK<span>OUT.</span>
          </h1>

          <p>
            Confirm your delivery details and complete your order.
          </p>
        </header>

        {cart.length === 0 ? (
          <section className="checkout-empty">
            <FaShoppingBag />

            <h2>YOUR BAG IS EMPTY.</h2>

            <p>
              Add some products before proceeding to checkout.
            </p>

            <Link to="/" className="checkout-primary-button">
              START SHOPPING <FaArrowRight />
            </Link>
          </section>
        ) : (
          <form
            className="checkout-layout"
            onSubmit={handleSubmit}
          >
            {/* Left section */}
            <section className="checkout-form-section">
              {/* Delivery information */}
              <div className="checkout-panel">
                <div className="checkout-panel-heading">
                  <FaMapMarkerAlt />

                  <div>
                    <p>STEP 01</p>
                    <h2>DELIVERY INFORMATION</h2>
                  </div>
                </div>

                <div className="checkout-field">
                  <label htmlFor="shipping_address">
                    FULL DELIVERY ADDRESS
                  </label>

                  <textarea
                    id="shipping_address"
                    name="shipping_address"
                    value={form.shipping_address}
                    onChange={handleChange}
                    placeholder="Enter your district, town, area, street and other delivery details"
                    rows={4}
                    required
                  />
                </div>

                {/* Google Maps controls */}
                <div className="checkout-map-controls">
                  {isMapLoaded && (
                    <Autocomplete
                      onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete;
                      }}
                      onPlaceChanged={handlePlaceChanged}
                      options={{
                        fields: [
                          "formatted_address",
                          "geometry",
                          "name",
                        ],
                      }}
                    >
                      <input
                        type="text"
                        className="checkout-map-search"
                        placeholder="Search for a town, building, street or landmark..."
                      />
                    </Autocomplete>
                  )}

                  <button
                    type="button"
                    className="checkout-location-button"
                    onClick={handleUseCurrentLocation}
                    disabled={!isMapLoaded || locating}
                  >
                    <FaLocationArrow />

                    {locating
                      ? "DETECTING LOCATION..."
                      : "USE MY CURRENT LOCATION"}
                  </button>
                </div>

                <p className="checkout-location-status">
                  {mapLoadError
                    ? "Google Maps failed to load. Check your API key and API restrictions."
                    : !isMapLoaded
                      ? "Loading Google Maps..."
                      : locationStatus}
                </p>

                {/* Google Map */}
                {mapLoadError ? (
                  <div className="checkout-map-error">
                    <FaExclamationCircle />
                    <span>
                      Unable to load Google Maps. You can still
                      enter your delivery address manually.
                    </span>
                  </div>
                ) : isMapLoaded ? (
                  <div className="checkout-map-container">
                    <GoogleMap
                      mapContainerStyle={MAP_CONTAINER_STYLE}
                      center={mapCenter}
                      zoom={location ? 16 : 12}
                      onClick={handleMapClick}
                      options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                        clickableIcons: false,
                      }}
                    >
                      {location && (
                        <Marker
                          position={location}
                          draggable
                          onDragEnd={handleMarkerDrag}
                          title="Your delivery location"
                        />
                      )}
                    </GoogleMap>
                  </div>
                ) : (
                  <div className="checkout-map-loading">
                    LOADING MAP...
                  </div>
                )}

                <p className="checkout-map-hint">
                  Search for your delivery address, use your
                  current location, or click anywhere on the map
                  to select your delivery point. You can also
                  drag the marker to adjust its position.
                </p>

                {/* Order notes */}
                <div className="checkout-field">
                  <label htmlFor="notes">
                    ORDER NOTES (OPTIONAL)
                  </label>

                  <textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Any special delivery instructions?"
                    rows={3}
                  />
                </div>
              </div>

              {/* Payment method */}
              <div className="checkout-panel">
                <div className="checkout-panel-heading">
                  <FaMoneyBillWave />

                  <div>
                    <p>STEP 02</p>
                    <h2>PAYMENT METHOD</h2>
                  </div>
                </div>

                <div className="checkout-payment-options">
                  {/* Cash */}
                  <label className="checkout-payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={form.payment_method === "cash"}
                      onChange={handleChange}
                    />

                    <FaMoneyBillWave />

                    <span>
                      <strong>CASH ON DELIVERY</strong>
                      <small>
                        Pay when your order is delivered.
                      </small>
                    </span>
                  </label>

                  {/* Mobile Money */}
                  <label className="checkout-payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="mobile_money"
                      checked={
                        form.payment_method === "mobile_money"
                      }
                      onChange={handleChange}
                    />

                    <FaMobileAlt />

                    <span>
                      <strong>MOBILE MONEY</strong>
                      <small>
                        Pay using MTN MoMo or Airtel Money.
                      </small>
                    </span>
                  </label>

                  {/* Network selection */}
                  {form.payment_method === "mobile_money" && (
                    <div className="checkout-mobile-money">
                      <h3>SELECT YOUR NETWORK</h3>

                      <div className="checkout-network-options">
                        <label
                          className={`checkout-network-option ${
                            form.mobile_money_provider === "mtn_momo"
                              ? "active"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="mobile_money_provider"
                            value="mtn_momo"
                            checked={
                              form.mobile_money_provider === "mtn_momo"
                            }
                            onChange={handleChange}
                          />

                          <span className="network-name">
                            MTN MoMo
                          </span>

                          <small>MTN Uganda</small>
                        </label>

                        <label
                          className={`checkout-network-option ${
                            form.mobile_money_provider === "airtel_money"
                              ? "active"
                              : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="mobile_money_provider"
                            value="airtel_money"
                            checked={
                              form.mobile_money_provider === "airtel_money"
                            }
                            onChange={handleChange}
                          />

                          <span className="network-name">
                            Airtel Money
                          </span>

                          <small>Airtel Uganda</small>
                        </label>
                      </div>

                      <div className="checkout-field">
                        <label htmlFor="mobile_money_phone">
                          MOBILE MONEY PHONE NUMBER
                        </label>

                        <input
                          type="tel"
                          id="mobile_money_phone"
                          name="mobile_money_phone"
                          value={form.mobile_money_phone}
                          onChange={handleChange}
                          placeholder="e.g. 0772123456"
                          autoComplete="tel"
                          required
                        />

                        <small>
                          Enter the phone number that should receive
                          the payment request.
                        </small>
                      </div>

                      <div className="checkout-mobile-money-notice">
                        You will receive a payment prompt on your
                        selected network. Approve the payment on
                        your phone.
                      </div>
                    </div>
                  )}

                  {/* Bank transfer */}
                  <label className="checkout-payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="bank_transfer"
                      checked={
                        form.payment_method === "bank_transfer"
                      }
                      onChange={handleChange}
                    />

                    <FaUniversity />

                    <span>
                      <strong>BANK TRANSFER</strong>
                      <small>
                        Bank payment instructions will be provided.
                      </small>
                    </span>
                  </label>

                  {/* Card */}
                  <label className="checkout-payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={form.payment_method === "card"}
                      onChange={handleChange}
                    />

                    <FaCreditCard />

                    <span>
                      <strong>CARD PAYMENT</strong>
                      <small>
                        Requires an integrated payment gateway.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="checkout-error" role="alert">
                  <FaExclamationCircle />
                  <span>{error}</span>
                </div>
              )}
            </section>

            {/* Order summary */}
            <aside className="checkout-summary">
              <p className="checkout-eyebrow">FINAL STEP</p>

              <h2>YOUR ORDER.</h2>

              <div className="checkout-summary-items">
                   {cart.map((item) => (
                     <div
                       key={
                         item.cart_key ||
                         `${item.id}::${item.selected_size || ""}`
                       }
                     >
                       <div className="checkout-summary-product">
                         <span className="checkout-summary-quantity">
                           {item.quantity}
                         </span>
                     
                         <span className="checkout-summary-name">
                           {item.name}
                     
                           {item.selected_size && (
                             <small className="checkout-summary-size">
                               SIZE: {item.selected_size}
                             </small>
                           )}
                         </span>
                       </div>
                         
                       <strong>
                         {formatPrice(
                           Number(item.price || 0) *
                             Number(item.quantity || 0)
                         )}
                       </strong>
                     </div>
                   ))}
              </div>

              <div className="checkout-summary-row">
                <span>ITEMS</span>

                <span>
                  {cart.reduce(
                    (total, item) =>
                      total + Number(item.quantity || 0),
                    0
                  )}
                </span>
              </div>

              <div className="checkout-summary-row">
                <span>SUBTOTAL</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="checkout-summary-row checkout-summary-total">
                <span>TOTAL</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <p className="checkout-summary-note">
                The final order total will be calculated and
                validated by the server. Delivery charges, if
                applicable, may be confirmed separately.
              </p>

              {hasStockIssue && (
                <div className="checkout-stock-warning">
                  <FaExclamationCircle />

                  <span>
                    Please review your cart. Some products have
                    insufficient stock.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="checkout-submit-button"
                disabled={submitting || hasStockIssue}
              >
                {submitting ? (
                  "PLACING ORDER..."
                ) : (
                  <>
                    PLACE ORDER <FaArrowRight />
                  </>
                )}
              </button>

              <Link
                to="/cart"
                className="checkout-back-link"
              >
                <FaArrowLeft />
                RETURN TO SHOPPING BAG
              </Link>

              <div className="checkout-secure-note">
                <FaShoppingBag />
                <span>THANK YOU FOR SHOPPING WITH ADRIAN.</span>
              </div>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}

export default Checkout;