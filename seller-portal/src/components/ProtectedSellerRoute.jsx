import { Navigate, Outlet } from "react-router-dom";
import useSellerAuthStore from "../store/sellerAuthStore";

function ProtectedSellerRoute() {
    const isAuthenticated = useSellerAuthStore(
        (state) => state.isAuthenticated
    );

    return isAuthenticated
        ? <Outlet />
        : <Navigate to="/login" replace />;
}

export default ProtectedSellerRoute;
