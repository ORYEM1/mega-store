import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import ChatWidget from "./components/ChatWidget/ChatWidget";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import PaymentPending from "./pages/PaymentPending/PaymentPending";
import SellerLogin from "./pages/Seller/Login/SellerLogin";
import SellerRegister from "./pages/Seller/Register/SellerRegister";
import Account from "./pages/Account/Account";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />

        <Route
          path="/payment-pending"
          element={<PaymentPending />}
        />
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/account" element={<Account/>}/>
      </Routes>

      {/* Live chat available across all pages */}
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;