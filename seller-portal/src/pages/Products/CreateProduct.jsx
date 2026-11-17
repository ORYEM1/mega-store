import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaImage,
    FaPlus,
    FaTrash,
} from "react-icons/fa";

import {
    createSellerProduct,
    getSellerCategories,
} from "../../services/sellerApi";

import "./CreateProduct.css";

function CreateProduct() {
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        category_id: "",
        description: "",
        price: "",
        compare_at_price: "",
        color: "",
        stock_quantity: "",
    });

    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);

    const [sizes, setSizes] = useState([]);

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    // Load available categories from Laravel
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await getSellerCategories();

                setCategories(response.categories || []);
            } catch (error) {
                setMessage(
                    error.response?.data?.message ||
                    "Unable to load product categories."
                );
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    // Handle normal input changes
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: null,
        }));
    };

    // Handle image selection
    const handlePhotoChange = (event) => {
        const file = event.target.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage("Please select a valid image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage("Image must not exceed 5 MB.");
            return;
        }

        setPhoto(file);
        setPreview(URL.createObjectURL(file));
        setMessage("");
    };

    // Add a size variation
    const addSize = () => {
        setSizes((previous) => [
            ...previous,
            {
                size: "",
                stock_quantity: "",
            },
        ]);
    };

    // Update a size variation
    const handleSizeChange = (index, field, value) => {
        setSizes((previous) =>
            previous.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item
            )
        );
    };

    // Remove a size variation
    const removeSize = (index) => {
        setSizes((previous) =>
            previous.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    // Prepare and submit product
    const handleSubmit = async (event) => {
        event.preventDefault();

        setSubmitting(true);
        setErrors({});
        setMessage("");

        const data = new FormData();

        data.append("name", formData.name);
        data.append("price", formData.price);

        if (formData.category_id) {
            data.append("category_id", formData.category_id);
        }

        if (formData.description) {
            data.append("description", formData.description);
        }

        if (formData.compare_at_price) {
            data.append(
                "compare_at_price",
                formData.compare_at_price
            );
        }

        if (formData.color) {
            data.append("color", formData.color);
        }

        if (sizes.length > 0) {
            sizes.forEach((item, index) => {
                data.append(
                    `sizes[${index}][size]`,
                    item.size
                );

                data.append(
                    `sizes[${index}][stock_quantity]`,
                    item.stock_quantity
                );
            });
        } else {
            data.append(
                "stock_quantity",
                formData.stock_quantity || 0
            );
        }

        if (photo) {
            data.append("photo", photo);
        }

        try {
            const response = await createSellerProduct(data);

            setMessage(
                response.message ||
                "Product created successfully."
            );

            setTimeout(() => {
                navigate("/products");
            }, 1500);

        } catch (error) {
            const validationErrors =
                error.response?.data?.errors;

            if (validationErrors) {
                setErrors(validationErrors);
            }

            setMessage(
                error.response?.data?.message ||
                "Unable to create product. Please check your details."
            );

        } finally {
            setSubmitting(false);
        }
    };

    // Flatten parent and child categories
    const categoryOptions = categories.flatMap((category) => [
        {
            id: category.id,
            name: category.name,
        },
        ...(category.children || []).map((child) => ({
            id: child.id,
            name: `${category.name} - ${child.name}`,
        })),
    ]);

    const getError = (field) => {
        return errors[field]?.[0];
    };

    return (
        <div className="create-product-page">

            <div className="create-product-header">

                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate("/products")}
                >
                    <FaArrowLeft />
                    Back to Products
                </button>

                <h1>Add New Product</h1>

                <p>
                    Add a product to your store and submit it
                    for administrator approval.
                </p>

            </div>

            {message && (
                <div className="product-message">
                    {message}
                </div>
            )}

            <form
                className="create-product-form"
                onSubmit={handleSubmit}
            >

                {/* Product Information */}

                <section className="product-form-section">

                    <h2>Product Information</h2>

                    <div className="form-group">

                        <label>Product Name *</label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter product name"
                            required
                        />

                        {getError("name") && (
                            <small>{getError("name")}</small>
                        )}

                    </div>

                    <div className="form-group">

                        <label>Category</label>

                        <select
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleChange}
                            disabled={loadingCategories}
                        >
                            <option value="">
                                {loadingCategories
                                    ? "Loading categories..."
                                    : "Select category"}
                            </option>

                            {categoryOptions.map((category) => (
                                <option
                                    key={category.id}
                                    value={category.id}
                                >
                                    {category.name}
                                </option>
                            ))}

                        </select>

                        {getError("category_id") && (
                            <small>{getError("category_id")}</small>
                        )}

                    </div>

                    <div className="form-group">

                        <label>Description</label>

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe your product..."
                            rows="5"
                        />

                    </div>

                </section>

                {/* Pricing */}

                <section className="product-form-section">

                    <h2>Pricing</h2>

                    <div className="form-row">

                        <div className="form-group">

                            <label>Selling Price (UGX) *</label>

                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="e.g. 50000"
                                min="0.01"
                                step="0.01"
                                required
                            />

                            {getError("price") && (
                                <small>{getError("price")}</small>
                            )}

                        </div>

                        <div className="form-group">

                            <label>Compare-at Price (UGX)</label>

                            <input
                                type="number"
                                name="compare_at_price"
                                value={formData.compare_at_price}
                                onChange={handleChange}
                                placeholder="Optional"
                                min="0"
                                step="0.01"
                            />

                            {getError("compare_at_price") && (
                                <small>
                                    {getError("compare_at_price")}
                                </small>
                            )}

                        </div>

                    </div>

                </section>

                {/* Product Details */}

                <section className="product-form-section">

                    <h2>Product Details</h2>

                    <div className="form-group">

                        <label>Color</label>

                        <input
                            type="text"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            placeholder="e.g. Black, Red, Blue"
                        />

                    </div>

                </section>

                {/* Stock */}

                <section className="product-form-section">

                    <div className="section-heading-row">

                        <div>
                            <h2>Product Sizes & Stock</h2>

                            <p>
                                Add size variations if your product
                                comes in different sizes.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="add-size-button"
                            onClick={addSize}
                        >
                            <FaPlus />
                            Add Size
                        </button>

                    </div>

                    {sizes.length === 0 && (

                        <div className="form-group">

                            <label>Available Stock Quantity</label>

                            <input
                                type="number"
                                name="stock_quantity"
                                value={formData.stock_quantity}
                                onChange={handleChange}
                                placeholder="Enter available quantity"
                                min="0"
                            />

                            {getError("stock_quantity") && (
                                <small>
                                    {getError("stock_quantity")}
                                </small>
                            )}

                        </div>

                    )}

                    {sizes.map((item, index) => (

                        <div
                            className="size-row"
                            key={index}
                        >

                            <div className="form-group">

                                <label>Size</label>

                                <input
                                    type="text"
                                    value={item.size}
                                    onChange={(event) =>
                                        handleSizeChange(
                                            index,
                                            "size",
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. S, M, L, 38"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Quantity</label>

                                <input
                                    type="number"
                                    value={item.stock_quantity}
                                    onChange={(event) =>
                                        handleSizeChange(
                                            index,
                                            "stock_quantity",
                                            event.target.value
                                        )
                                    }
                                    min="0"
                                    placeholder="Quantity"
                                    required
                                />

                            </div>

                            <button
                                type="button"
                                className="remove-size-button"
                                onClick={() => removeSize(index)}
                                aria-label="Remove size"
                            >
                                <FaTrash />
                            </button>

                        </div>

                    ))}

                    {errors.sizes && (
                        <small>{errors.sizes[0]}</small>
                    )}

                </section>

                {/* Product Image */}

                <section className="product-form-section">

                    <h2>Product Image</h2>

                    <label className="image-upload-area">

                        {preview ? (
                            <img
                                src={preview}
                                alt="Product preview"
                                className="product-image-preview"
                            />
                        ) : (
                            <>
                                <FaImage />

                                <strong>
                                    Click to upload product image
                                </strong>

                                <span>
                                    JPG, PNG or WebP. Maximum 5 MB.
                                </span>
                            </>
                        )}

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePhotoChange}
                            hidden
                        />

                    </label>

                    {photo && (
                        <p className="selected-file-name">
                            Selected: {photo.name}
                        </p>
                    )}

                    {errors.photo && (
                        <small>{errors.photo[0]}</small>
                    )}

                </section>

                {/* Submit */}

                <div className="product-form-actions">

                    <button
                        type="button"
                        className="cancel-product-button"
                        onClick={() => navigate("/products")}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="submit-product-button"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Submitting..."
                            : "Submit Product"}
                    </button>

                </div>

            </form>

        </div>
    );
}

export default CreateProduct;
