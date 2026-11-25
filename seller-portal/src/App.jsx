import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import SellerLayout from "./layouts/SellerLayout";
import SellerLogin from "./pages/Auth/SellerLogin";
import SellerDashboard from "./pages/Dashboard/SellerDashboard";
import SellerProducts from "./pages/Products/SellerProducts";
import CreateProduct from "./pages/Products/CreateProduct";

import ProtectedSellerRoute from "./components/ProtectedSellerRoute";

function ComingSoon({ title }) {
    return (
        <div>
            <h1>{title}</h1>
            <p>This section will be available soon.</p>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/login"
                    element={<SellerLogin />}
                />

                <Route element={<ProtectedSellerRoute />}>

                    <Route element={<SellerLayout />}>

                        <Route
                            path="/"
                            element={<SellerDashboard />}
                        />

                        <Route
                            path="/products"
                            element={<SellerProducts />}
                        />

                        <Route
                            path="/products/create"
                            element={<CreateProduct />}
                        />

                        <Route
                            path="/orders"
                            element={<ComingSoon title="My Orders" />}
                        />

                        <Route
                            path="/profile"
                            element={<ComingSoon title="My Profile" />}
                        />

                    </Route>

                </Route>

                <Route
                    path="*"
                    element={<Navigate to="/login" replace />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;