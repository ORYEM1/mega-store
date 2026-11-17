import {
    FaBox,
    FaShoppingBag,
    FaMoneyBillWave,
    FaClock,
} from "react-icons/fa";

import "./SellerDashboard.css";

function SellerDashboard() {
    const statistics = [
        {
            title: "Total Products",
            value: "0",
            icon: <FaBox />,
        },
        {
            title: "Total Orders",
            value: "0",
            icon: <FaShoppingBag />,
        },
        {
            title: "Total Sales",
            value: "UGX 0",
            icon: <FaMoneyBillWave />,
        },
        {
            title: "Pending Orders",
            value: "0",
            icon: <FaClock />,
        },
    ];

    return (
        <div className="seller-dashboard">

            <div className="dashboard-heading">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome to your Adrian Collections seller account.</p>
                </div>

                <span className="dashboard-status">
                    Seller Portal
                </span>
            </div>

            <div className="dashboard-statistics">

                {statistics.map((item, index) => (
                    <div className="dashboard-stat-card" key={index}>

                        <div className="stat-icon">
                            {item.icon}
                        </div>

                        <div>
                            <p>{item.title}</p>
                            <h2>{item.value}</h2>
                        </div>

                    </div>
                ))}

            </div>

            <div className="dashboard-welcome">

                <div>
                    <h2>Grow your business with Adrian Collections.</h2>

                    <p>
                        Upload your products, manage inventory and
                        start receiving customer orders.
                    </p>
                </div>

                <div className="welcome-highlight">
                    AC
                </div>

            </div>

            <div className="dashboard-section">

                <h2>Recent Orders</h2>

                <div className="empty-dashboard">
                    <FaShoppingBag />

                    <h3>No orders yet</h3>

                    <p>
                        Your customer orders will appear here.
                    </p>
                </div>

            </div>

        </div>
    );
}

export default SellerDashboard;
