import React, { useEffect, useMemo, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import colors from "../theme/colors";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";

import {
    getProducts,
    getProductReviews,
    submitProductReview,
} from "../services/storeService";

const API_ROOT = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

function getProductImage(product) {
    const image = product.photo || product.image || product.image_url;

    if (!image) return null;
    if (image.startsWith("http")) return image;

    return `${API_ROOT}/storage/${image.replace(/^\/+/, "")}`;
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        maximumFractionDigits: 0,
    }).format(Number(price || 0));
}

function getDiscount(product) {
    const price = Number(product.price || 0);
    const originalPrice = Number(product.compare_at_price || 0);

    if (originalPrice <= price || originalPrice <= 0) {
        return 0;
    }

    return Math.round(
        ((originalPrice - price) / originalPrice) * 100
    );
}

function StarRating({ rating = 0, size = 17 }) {
    return (
        <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Text
                    key={star}
                    style={[
                        styles.displayStar,
                        { fontSize: size },
                        star <= Math.round(Number(rating))
                            ? styles.activeStar
                            : styles.inactiveStar,
                    ]}
                >
                    ★
                </Text>
            ))}
        </View>
    );
}

export default function ProductDetailsScreen({ route, navigation }) {
    const product = route.params?.product;

    const [selectedSize, setSelectedSize] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loadingSimilar, setLoadingSimilar] = useState(true);

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const [averageRating, setAverageRating] = useState(
        Number(product?.average_rating || 0)
    );

    const [reviewsCount, setReviewsCount] = useState(
        Number(product?.reviews_count || 0)
    );

    const [selectedRating, setSelectedRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [editingReview, setEditingReview] = useState(false);

    const addToCart = useCartStore((state) => state.addToCart);

    const customer = useAuthStore((state) => state.customer);
    const isAuthenticated = useAuthStore(
        (state) => state.isAuthenticated
    );

    const sizes = useMemo(
        () => Array.isArray(product?.sizes) ? product.sizes : [],
        [product]
    );

    const selectedSizeItem = sizes.find(
        (item) => String(item.size || item.name) === String(selectedSize)
    );

    const availableStock = sizes.length
        ? Number(selectedSizeItem?.stock_quantity || 0)
        : Number(product?.stock_quantity || 0);

    const requiresSize = sizes.length > 0;

    const categoryName =
        product?.category?.name || product?.category_name || "Other";

    const imageUrl = product ? getProductImage(product) : null;
    const discount = product ? getDiscount(product) : 0;

    // Load existing customer reviews.
    async function loadReviews() {
        if (!product?.id) return;

        try {
            setLoadingReviews(true);

            const response = await getProductReviews(product.id);

            const reviewList = Array.isArray(response?.data)
                ? response.data
                : [];

            setReviews(reviewList);

            // Find this customer's previous review.
            if (customer?.id) {
                const ownReview = reviewList.find(
                    (item) =>
                        String(item.customer_id) === String(customer.id)
                );

                if (ownReview) {
                    setSelectedRating(Number(ownReview.rating));
                    setReviewText(ownReview.review || "");
                    setEditingReview(true);
                }
            }
        } catch (error) {
            console.log(
                "Product reviews error:",
                error.response?.data || error.message
            );
        } finally {
            setLoadingReviews(false);
        }
    }

    // Refresh product rating information from the products API.
    async function refreshRatingSummary() {
        try {
            const products = await getProducts();

            const updatedProduct = products.find(
                (item) => String(item.id) === String(product?.id)
            );

            if (updatedProduct) {
                setAverageRating(
                    Number(updatedProduct.average_rating || 0)
                );

                setReviewsCount(
                    Number(updatedProduct.reviews_count || 0)
                );
            }
        } catch (error) {
            console.log(
                "Rating summary error:",
                error.response?.data || error.message
            );
        }
    }

    useEffect(() => {
        let mounted = true;

        async function loadSimilarProducts() {
            try {
                const products = await getProducts();

                if (!mounted) return;

                const currentCategoryId = String(
                    product?.category?.id || product?.category_id || ""
                );

                const sameCategory = products.filter((item) => {
                    const itemCategoryId = String(
                        item.category?.id || item.category_id || ""
                    );

                    return (
                        String(item.id) !== String(product?.id) &&
                        currentCategoryId !== "" &&
                        itemCategoryId === currentCategoryId
                    );
                });

                const recommendations = sameCategory.length > 0
                    ? sameCategory
                    : products.filter(
                        (item) => String(item.id) !== String(product?.id)
                    );

                setSimilarProducts(recommendations.slice(0, 10));
            } catch (error) {
                console.log(
                    "Similar products error:",
                    error.response?.data || error.message
                );
            } finally {
                if (mounted) {
                    setLoadingSimilar(false);
                }
            }
        }

        if (product?.id) {
            loadSimilarProducts();
            loadReviews();
        }

        return () => {
            mounted = false;
        };
    }, [product?.id]);

    // Load the customer's review when their authentication state changes.
    useEffect(() => {
        if (product?.id) {
            loadReviews();
        }
    }, [customer?.id]);

    if (!product) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>
                    Product not found.
                </Text>
            </View>
        );
    }

    function handleAddToCart() {
        if (requiresSize && !selectedSize) {
            Alert.alert(
                "Choose a size",
                "Please select a size before adding this product to your cart."
            );
            return;
        }

        if (availableStock < 1) {
            Alert.alert(
                "Out of stock",
                "This product or selected size is currently unavailable."
            );
            return;
        }

        addToCart(product, selectedSize);

        Alert.alert(
            "Added to cart",
            `${product.name} has been added to your cart.`,
            [
                { text: "Continue shopping", style: "cancel" },
                {
                    text: "View cart",
                    onPress: () =>
                        navigation.navigate("MainTabs", {
                            screen: "Cart",
                        }),
                },
            ]
        );
    }

    function handleLoginRequired() {
        Alert.alert(
            "Login required",
            "Please log in to your Adrian Collections account before rating a product.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Login",
                    onPress: () => navigation.navigate("Login"),
                },
            ]
        );
    }

    async function handleSubmitReview() {
        if (!isAuthenticated || !customer) {
            handleLoginRequired();
            return;
        }

        if (selectedRating < 1 || selectedRating > 5) {
            Alert.alert(
                "Select a rating",
                "Please choose between 1 and 5 stars."
            );
            return;
        }

        if (reviewText.trim().length > 2000) {
            Alert.alert(
                "Review too long",
                "Your review cannot exceed 2,000 characters."
            );
            return;
        }

        try {
            setSubmittingReview(true);

            const response = await submitProductReview(
                product.id,
                selectedRating,
                reviewText
            );

            setAverageRating(
                Number(response.average_rating || 0)
            );

            setReviewsCount(
                Number(response.reviews_count || 0)
            );

            setEditingReview(true);

            Alert.alert(
                "Review saved",
                response.message || "Thank you for reviewing this product."
            );

            await loadReviews();
            await refreshRatingSummary();
        } catch (error) {
            const message =
                error.response?.data?.message ||
                "Could not submit your review. Please try again.";

            if (error.response?.status === 401) {
                Alert.alert(
                    "Session expired",
                    "Please log in again to submit your review."
                );
            } else {
                Alert.alert("Review error", message);
            }

            console.log(
                "Submit review error:",
                error.response?.data || error.message
            );
        } finally {
            setSubmittingReview(false);
        }
    }

    function renderSimilarProduct(item) {
        const image = getProductImage(item);
        const itemDiscount = getDiscount(item);

        return (
            <TouchableOpacity
                key={item.id}
                style={styles.similarCard}
                activeOpacity={0.8}
                onPress={() =>
                    navigation.push("ProductDetails", {
                        product: item,
                    })
                }
            >
                <View style={styles.similarImageContainer}>
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            style={styles.similarImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.similarPlaceholder}>
                            <Text style={styles.placeholderText}>AC</Text>
                        </View>
                    )}

                    {itemDiscount > 0 && (
                        <View style={styles.similarDiscount}>
                            <Text style={styles.discountText}>
                                -{itemDiscount}%
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.similarInfo}>
                    <Text style={styles.similarName} numberOfLines={2}>
                        {item.name}
                    </Text>

                    <Text style={styles.similarPrice}>
                        {formatPrice(item.price)}
                    </Text>

                    {itemDiscount > 0 && (
                        <Text style={styles.similarOldPrice}>
                            {formatPrice(item.compare_at_price)}
                        </Text>
                    )}

                    {Number(item.reviews_count || 0) > 0 && (
                        <View style={styles.similarRating}>
                            <Text style={styles.smallStar}>★</Text>
                            <Text style={styles.similarRatingText}>
                                {Number(item.average_rating || 0).toFixed(1)}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    }

    function renderReview(item) {
        const firstName = item.customer?.first_name || "Customer";
        const lastName = item.customer?.last_name || "";

        const customerName = `${firstName} ${lastName}`.trim();

        return (
            <View key={item.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                            {firstName.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <View style={styles.reviewCustomer}>
                        <Text style={styles.reviewCustomerName}>
                            {customerName}
                        </Text>

                        <StarRating
                            rating={item.rating}
                            size={14}
                        />
                    </View>
                </View>

                {item.review ? (
                    <Text style={styles.reviewBody}>
                        {item.review}
                    </Text>
                ) : (
                    <Text style={styles.reviewBodyEmpty}>
                        Customer left a star rating without a comment.
                    </Text>
                )}

                <Text style={styles.reviewDate}>
                    {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : ""}
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* PRODUCT IMAGE */}
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>
                                MEGA STORE
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backText}>←</Text>
                    </TouchableOpacity>

                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                                SAVE {discount}%
                            </Text>
                        </View>
                    )}
                </View>

                {/* PRODUCT INFORMATION */}
                <View style={styles.content}>
                    <Text style={styles.categoryName}>
                        {categoryName.toUpperCase()}
                    </Text>

                    <Text style={styles.productName}>
                        {product.name}
                    </Text>

                    {/* PRICE COMPARISON */}
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>
                            {formatPrice(product.price)}
                        </Text>

                        {discount > 0 && (
                            <Text style={styles.originalPrice}>
                                {formatPrice(product.compare_at_price)}
                            </Text>
                        )}
                    </View>

                    {discount > 0 && (
                        <Text style={styles.savingsText}>
                            You save {formatPrice(
                                Number(product.compare_at_price) -
                                Number(product.price)
                            )}
                        </Text>
                    )}

                    {/* REAL PRODUCT RATING */}
                    <TouchableOpacity
                        style={styles.ratingContainer}
                        activeOpacity={0.8}
                        onPress={() => {
                            // The review form is displayed below.
                        }}
                    >
                        <StarRating rating={averageRating} size={19} />

                        <Text style={styles.ratingNumber}>
                            {averageRating > 0
                                ? averageRating.toFixed(1)
                                : "New"}
                        </Text>

                        <Text style={styles.ratingText}>
                            ({reviewsCount} {reviewsCount === 1 ? "review" : "reviews"})
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* DESCRIPTION */}
                    <Text style={styles.sectionTitle}>
                        PRODUCT DESCRIPTION
                    </Text>

                    <Text style={styles.description}>
                        {product.description ||
                            "Discover this item from Adrian Collections."}
                    </Text>

                    {/* PRODUCT INFORMATION - SKU REMOVED */}
                    <View style={styles.detailsBox}>
                        <Text style={styles.sectionTitle}>
                            PRODUCT INFORMATION
                        </Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                                CATEGORY
                            </Text>

                            <Text style={styles.detailValue}>
                                {categoryName}
                            </Text>
                        </View>

                        {product.color && (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>
                                    COLOR
                                </Text>

                                <Text style={styles.detailValue}>
                                    {product.color}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* SIZE SELECTION */}
                    {requiresSize && (
                        <>
                            <Text style={styles.sectionTitle}>
                                SELECT SIZE
                            </Text>

                            <View style={styles.sizeContainer}>
                                {sizes.map((item, index) => {
                                    const sizeName = String(
                                        item.size || item.name || item.id
                                    );

                                    const isSelected =
                                        selectedSize === sizeName;

                                    const inStock =
                                        Number(item.stock_quantity || 0) > 0;

                                    return (
                                        <TouchableOpacity
                                            key={item.id || sizeName || index}
                                            disabled={!inStock}
                                            onPress={() =>
                                                setSelectedSize(sizeName)
                                            }
                                            style={[
                                                styles.sizeButton,
                                                isSelected && styles.selectedSize,
                                                !inStock && styles.disabledSize,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.sizeText,
                                                    isSelected && styles.selectedSizeText,
                                                    !inStock && styles.disabledSizeText,
                                                ]}
                                            >
                                                {sizeName}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* AVAILABILITY */}
                    <View style={styles.stockContainer}>
                        <Text style={styles.stockLabel}>
                            AVAILABILITY
                        </Text>

                        <Text
                            style={[
                                styles.stockValue,
                                availableStock < 1 && styles.outOfStock,
                            ]}
                        >
                            {requiresSize && !selectedSize
                                ? "SELECT A SIZE"
                                : availableStock > 0
                                    ? `${availableStock} AVAILABLE`
                                    : "OUT OF STOCK"}
                        </Text>
                    </View>

                    {/* WRITE A REVIEW */}
                    <View style={styles.reviewForm}>
                        <Text style={styles.sectionTitle}>
                            {editingReview ? "UPDATE YOUR REVIEW" : "RATE THIS PRODUCT"}
                        </Text>

                        <Text style={styles.formSubtitle}>
                            {editingReview
                                ? "You can change your rating and review below."
                                : "How would you rate this product?"}
                        </Text>

                        <View style={styles.ratingPicker}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setSelectedRating(star)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.pickerStar,
                                            star <= selectedRating
                                                ? styles.activeStar
                                                : styles.inactiveStar,
                                        ]}
                                    >
                                        ★
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.ratingHint}>
                            {selectedRating === 0
                                ? "Tap a star to rate"
                                : selectedRating === 1
                                    ? "Poor"
                                    : selectedRating === 2
                                        ? "Fair"
                                        : selectedRating === 3
                                            ? "Good"
                                            : selectedRating === 4
                                                ? "Very good"
                                                : "Excellent"}
                        </Text>

                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Write your experience with this product (optional)..."
                            placeholderTextColor={colors.muted}
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            maxLength={2000}
                            textAlignVertical="top"
                        />

                        <Text style={styles.characterCount}>
                            {reviewText.length}/2000
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.submitReviewButton,
                                (
                                    selectedRating < 1 ||
                                    submittingReview
                                ) && styles.submitReviewDisabled,
                            ]}
                            disabled={
                                selectedRating < 1 || submittingReview
                            }
                            onPress={handleSubmitReview}
                        >
                            {submittingReview ? (
                                <ActivityIndicator
                                    color={colors.background}
                                />
                            ) : (
                                <Text style={styles.submitReviewText}>
                                    {editingReview
                                        ? "UPDATE REVIEW"
                                        : "SUBMIT REVIEW"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {!isAuthenticated && (
                            <Text style={styles.loginHint}>
                                Log in to your account to submit a rating.
                            </Text>
                        )}
                    </View>

                    {/* CUSTOMER REVIEWS */}
                    <View style={styles.reviewsBox}>
                        <View style={styles.reviewsHeading}>
                            <Text style={styles.sectionTitle}>
                                CUSTOMER REVIEWS
                            </Text>

                            <Text style={styles.reviewsTotal}>
                                {reviewsCount}
                            </Text>
                        </View>

                        {loadingReviews ? (
                            <ActivityIndicator
                                color={colors.primary}
                                style={{ marginVertical: 25 }}
                            />
                        ) : reviews.length > 0 ? (
                            reviews.map(renderReview)
                        ) : (
                            <View style={styles.emptyReviews}>
                                <Text style={styles.emptyReviewIcon}>
                                    ★
                                </Text>

                                <Text style={styles.reviewEmpty}>
                                    No customer reviews yet.
                                </Text>

                                <Text style={styles.reviewSubtext}>
                                    Be the first to review this product.
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* SIMILAR PRODUCTS */}
                <View style={styles.similarSection}>
                    <Text style={styles.sectionTitle}>
                        YOU MAY ALSO LIKE
                    </Text>

                    <Text style={styles.similarSubtitle}>
                        Discover more from Adrian Collections.
                    </Text>

                    {loadingSimilar ? (
                        <ActivityIndicator
                            color={colors.primary}
                            style={{ marginVertical: 25 }}
                        />
                    ) : similarProducts.length > 0 ? (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.similarList}
                        >
                            {similarProducts.map(renderSimilarProduct)}
                        </ScrollView>
                    ) : (
                        <Text style={styles.reviewEmpty}>
                            No recommendations available right now.
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* FIXED ADD TO CART BAR */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.bottomLabel}>PRICE</Text>

                    <Text style={styles.bottomPrice}>
                        {formatPrice(product.price)}
                    </Text>

                    {discount > 0 && (
                        <Text style={styles.bottomOldPrice}>
                            {formatPrice(product.compare_at_price)}
                        </Text>
                    )}
                </View>

                <TouchableOpacity
                    style={[
                        styles.addButton,
                        (
                            (requiresSize && !selectedSize) ||
                            availableStock < 1
                        ) && styles.addButtonDisabled,
                    ]}
                    onPress={handleAddToCart}
                >
                    <Text style={styles.addButtonText}>
                        ADD TO CART +
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    scrollContent: {
        paddingBottom: 20,
    },

    imageContainer: {
        height: 380,
        backgroundColor: colors.surface,
        position: "relative",
    },

    productImage: {
        width: "100%",
        height: "100%",
    },

    imagePlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    placeholderText: {
        color: colors.primary,
        fontSize: 35,
        fontWeight: "900",
    },

    backButton: {
        position: "absolute",
        top: 50,
        left: 20,
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },

    backText: {
        color: colors.primary,
        fontSize: 27,
    },

    discountBadge: {
        position: "absolute",
        bottom: 20,
        left: 20,
        backgroundColor: colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
    },

    discountText: {
        color: colors.background,
        fontWeight: "900",
        fontSize: 11,
    },

    content: {
        padding: 20,
    },

    categoryName: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 8,
    },

    productName: {
        color: colors.white,
        fontSize: 25,
        fontWeight: "900",
    },

    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 12,
    },

    price: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: "900",
    },

    originalPrice: {
        color: colors.muted,
        fontSize: 16,
        textDecorationLine: "line-through",
    },

    savingsText: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "800",
        marginTop: 7,
    },

    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        gap: 8,
    },

    starRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    displayStar: {
        marginRight: 2,
    },

    activeStar: {
        color: colors.primary,
    },

    inactiveStar: {
        color: "#555555",
    },

    ratingNumber: {
        color: colors.white,
        fontSize: 13,
        fontWeight: "900",
    },

    ratingText: {
        color: colors.muted,
        fontSize: 12,
    },

    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 22,
    },

    sectionTitle: {
        color: colors.white,
        fontSize: 13,
        fontWeight: "900",
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 15,
    },

    description: {
        color: colors.muted,
        fontSize: 14,
        lineHeight: 23,
    },

    detailsBox: {
        marginTop: 25,
        padding: 15,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },

    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    detailLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "800",
    },

    detailValue: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "700",
    },

    sizeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },

    sizeButton: {
        minWidth: 50,
        padding: 13,
        borderRadius: 9,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
    },

    selectedSize: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    sizeText: {
        color: colors.white,
        fontWeight: "800",
    },

    selectedSizeText: {
        color: colors.background,
    },

    disabledSize: {
        opacity: 0.35,
    },

    disabledSizeText: {
        textDecorationLine: "line-through",
    },

    stockContainer: {
        marginTop: 25,
        padding: 15,
        borderRadius: 10,
        backgroundColor: colors.surface,
        flexDirection: "row",
        justifyContent: "space-between",
    },

    stockLabel: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "800",
    },

    stockValue: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "900",
    },

    outOfStock: {
        color: colors.danger,
    },

    reviewForm: {
        marginTop: 25,
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },

    formSubtitle: {
        color: colors.muted,
        fontSize: 12,
        marginBottom: 15,
    },

    ratingPicker: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    pickerStar: {
        fontSize: 35,
    },

    ratingHint: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: "800",
        marginTop: 7,
    },

    reviewInput: {
        minHeight: 110,
        marginTop: 18,
        padding: 13,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        color: colors.white,
        fontSize: 13,
        lineHeight: 20,
    },

    characterCount: {
        color: colors.muted,
        fontSize: 10,
        textAlign: "right",
        marginTop: 6,
    },

    submitReviewButton: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 9,
        alignItems: "center",
        marginTop: 15,
    },

    submitReviewDisabled: {
        opacity: 0.4,
    },

    submitReviewText: {
        color: colors.background,
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 1,
    },

    loginHint: {
        color: colors.muted,
        fontSize: 11,
        textAlign: "center",
        marginTop: 12,
    },

    reviewsBox: {
        marginTop: 25,
        padding: 15,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },

    reviewsHeading: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    reviewsTotal: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: "900",
    },

    emptyReviews: {
        alignItems: "center",
        paddingVertical: 20,
    },

    emptyReviewIcon: {
        color: colors.primary,
        fontSize: 30,
        marginBottom: 10,
    },

    reviewEmpty: {
        color: colors.white,
        fontSize: 13,
        fontWeight: "700",
    },

    reviewSubtext: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 7,
    },

    reviewCard: {
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },

    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    reviewAvatar: {
        width: 38,
        height: 38,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    reviewAvatarText: {
        color: colors.background,
        fontSize: 15,
        fontWeight: "900",
    },

    reviewCustomer: {
        flex: 1,
    },

    reviewCustomerName: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "900",
        marginBottom: 4,
    },

    reviewBody: {
        color: colors.white,
        fontSize: 13,
        lineHeight: 21,
        marginTop: 12,
    },

    reviewBodyEmpty: {
        color: colors.muted,
        fontSize: 12,
        fontStyle: "italic",
        marginTop: 12,
    },

    reviewDate: {
        color: colors.muted,
        fontSize: 10,
        marginTop: 10,
    },

    similarSection: {
        marginTop: 10,
        paddingVertical: 15,
    },

    similarSubtitle: {
        color: colors.muted,
        fontSize: 12,
        marginHorizontal: 20,
        marginBottom: 15,
    },

    similarList: {
        paddingHorizontal: 20,
        gap: 12,
    },

    similarCard: {
        width: 155,
        backgroundColor: colors.surface,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
    },

    similarImageContainer: {
        height: 155,
        position: "relative",
    },

    similarImage: {
        width: "100%",
        height: "100%",
    },

    similarPlaceholder: {
        flex: 1,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
    },

    similarDiscount: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 5,
    },

    similarInfo: {
        padding: 10,
    },

    similarName: {
        color: colors.white,
        fontSize: 12,
        fontWeight: "700",
        minHeight: 32,
    },

    similarPrice: {
        color: colors.primary,
        fontWeight: "900",
        marginTop: 7,
    },

    similarOldPrice: {
        color: colors.muted,
        fontSize: 10,
        textDecorationLine: "line-through",
        marginTop: 3,
    },

    similarRating: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 7,
        gap: 4,
    },

    smallStar: {
        color: colors.primary,
        fontSize: 12,
    },

    similarRatingText: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: "800",
    },

    bottomBar: {
        padding: 15,
        paddingBottom: 25,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    bottomLabel: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: "800",
    },

    bottomPrice: {
        color: colors.primary,
        fontSize: 17,
        fontWeight: "900",
        marginTop: 4,
    },

    bottomOldPrice: {
        color: colors.muted,
        fontSize: 10,
        textDecorationLine: "line-through",
    },

    addButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 25,
        paddingVertical: 16,
        borderRadius: 10,
    },

    addButtonDisabled: {
        opacity: 0.5,
    },

    addButtonText: {
        color: colors.background,
        fontWeight: "900",
        fontSize: 12,
    },

    errorText: {
        color: colors.white,
        textAlign: "center",
        marginTop: 50,
    },
});