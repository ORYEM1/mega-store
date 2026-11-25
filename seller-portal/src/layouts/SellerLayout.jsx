import { NavLink, Outlet } from "react-router-dom";
import {
    FaTachometerAlt,
    FaBox,
    FaShoppingBag,
    FaUser,
    FaSignOutAlt,
    FaStore,
} from "react-icons/fa";

import useSellerAuthStore from "../store/sellerAuthStore";
import "./SellerLayout.css";

function SellerLayout() {
    const seller = useSellerAuthStore((state) => state.seller);
    const logout = useSellerAuthStore((state) => state.logout);

    const handleLogout = () => {
        logout();
        window.location.href = "/login";
    };

    return (
        <div className="seller-layout">

            <aside className="seller-sidebar">

                <div className="seller-brand">
                    <FaStore />
                    <span>ADRIAN <strong>SELLER</strong></span>
                </div>

                <div className="seller-menu-title">
                    MAIN MENU
                </div>

                <nav className="seller-navigation">

                    <NavLink to="/" end>
                        <FaTachometerAlt />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/products">
                        <FaBox />
                        <span>My Products</span>
                    </NavLink>

                    <NavLink to="/orders">
                        <FaShoppingBag />
                        <span>Orders</span>
                    </NavLink>

                    <NavLink to="/profile">
                        <FaUser />
                        <span>My Profile</span>
                    </NavLink>

                </nav>

                <button
                    className="seller-logout"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt />
                    <span>Logout</span>
                </button>

            </aside>

            <main className="seller-main">

                <header className="seller-topbar">

                    <div>
                        <h2>Seller Portal</h2>
                        <p>Manage your business</p>
                    </div>

                    <div className="seller-account">
                        <div className="seller-avatar">
                            {seller?.first_name?.charAt(0) || "S"}
                        </div>

                        <div>
                            <strong>
                                {seller?.first_name || "Seller"}
                            </strong>

                            <small>Seller Account</small>
                        </div>
                    </div>

                </header>

                <section className="seller-content">
                    <Outlet />
                </section>

            </main>

        </div>
    );
}

export default SellerLayout;
