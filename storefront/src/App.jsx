import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Global components
import ChatWidget from "./components/ChatWidget/ChatWidget";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

// Lazy-loaded pages
const Home = lazy(() => import("./pages/Home/Home"));
const Register = lazy(() => import("./pages/Register/Register"));
const Login = lazy(() => import("./pages/Login/Login"));
const ProductDetails = lazy(() =>
  import("./pages/ProductDetails/ProductDetails")
);
const Cart = lazy(() => import("./pages/Cart/Cart"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const OrderSuccess = lazy(() =>
  import("./pages/OrderSuccess/OrderSuccess")
);
const PaymentPending = lazy(() =>
  import("./pages/PaymentPending/PaymentPending")
);
const SellerLogin = lazy(() =>
  import("./pages/Seller/Login/SellerLogin")
);
const SellerRegister = lazy(() =>
  import("./pages/Seller/Register/SellerRegister")
);
const Account = lazy(() => import("./pages/Account/Account"));

// Loading component
function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner"></div>
      <p>LOADING MEGA STORE...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />

          <Route
            path="/order-success"
            element={<OrderSuccess />}
          />

          <Route
            path="/payment-pending"
            element={<PaymentPending />}
          />

          <Route
            path="/seller/login"
            element={<SellerLogin />}
          />

          <Route
            path="/seller/register"
            element={<SellerRegister />}
          />

          <Route path="/account" element={<Account />} />
        </Routes>
      </Suspense>

      {/* Live chat available across all pages */}
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;