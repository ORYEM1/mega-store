import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaBox, FaSync } from "react-icons/fa";

import { getSellerProducts } from "../../services/sellerApi";
import "./SellerProducts.css";

const API_URL = (
    import.meta.env.VITE_API_URL || "http://192.168.10.246:8000/api"
).replace(/\/api\/?$/, "");

function getImageUrl(photo) {
    if (!photo) return null;

    if (photo.startsWith("http")) {
        return photo;
    }

    return `${API_URL}/storage/${photo.replace(/^\/+/, "")}`;
}

function SellerProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProducts = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getSellerProducts();

            // Laravel pagination normally returns products inside data.
            const productList = Array.isArray(response)
                ? response
                : Array.isArray(response.data)
                    ? response.data
                    : [];

            setProducts(productList);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load your products. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    return (
        <div className="seller-products-page">

            <div className="seller-products-heading">

                <div>
                    <h1>My Products</h1>
                    <p>Manage the products you sell on Adrian Collections.</p>
                </div>

                <Link
                    to="/products/create"
                    className="add-product-button"
                >
                    <FaPlus />
                    Add Product
                </Link>

            </div>

            <div className="seller-products-summary">
                <div>
                    <span>Total Products</span>
                    <strong>{products.length}</strong>
                </div>

                <button
                    type="button"
                    onClick={loadProducts}
                    disabled={loading}
                    className="refresh-products-button"
                >
                    <FaSync />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="products-error">
                    {error}
                    <button onClick={loadProducts}>Try again</button>
                </div>
            )}

            {loading ? (

                <div className="products-loading">
                    Loading your products...
                </div>

            ) : products.length === 0 ? (

                <div className="products-empty">

                    <FaBox />

                    <h2>No products yet</h2>

                    <p>
                        You haven't uploaded any products.
                        Start by adding your first product.
                    </p>

                    <Link to="/products/create">
                        Add Your First Product
                    </Link>

                </div>

            ) : (

                <div className="seller-products-table-wrapper">

                    <table className="seller-products-table">

                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {products.map((product) => (

                                <tr key={product.id}>

                                    <td>
                                        <div className="seller-product-info">

                                            {product.photo ? (
                                                <img
                                                    src={getImageUrl(product.photo)}
                                                    alt={product.name}
                                                />
                                            ) : (
                                                <div className="product-image-placeholder">
                                                    <FaBox />
                                                </div>
                                            )}

                                            <div>
                                                <strong>{product.name}</strong>
                                                <small>
                                                    SKU: {product.sku || "Not assigned"}
                                                </small>
                                            </div>

                                        </div>
                                    </td>

                                    <td>
                                        UGX {Number(product.price || 0).toLocaleString("en-UG")}
                                    </td>

                                    <td>
                                        {product.stock_quantity ?? 0}
                                    </td>

                                    <td>
                                        <span className={
                                            product.is_published
                                                ? "product-status published"
                                                : "product-status pending"
                                        }>
                                            {product.is_published
                                                ? "Published"
                                                : "Pending Approval"}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="product-action-placeholder">
                                            Manage soon
                                        </span>
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </div>
    );
}

export default SellerProducts;
