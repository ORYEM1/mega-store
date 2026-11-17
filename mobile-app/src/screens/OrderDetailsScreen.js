
import React, { useCallback, useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from "react-native";

import { getOrderDetails } from "../services/storeService";

const GREEN = "#C6FF00";

const API_ROOT = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

function getProductImageUrl(product) {
    const image =
        product?.photo ||
        product?.image ||
        product?.product_image ||
        product?.image_url;

    if (!image || typeof image !== "string") {
        return null;
    }

    if (image.startsWith("http")) {
        return image;
    }

    const cleanImage = image
        .replace(/^\/+/, "")
        .replace(/^storage\//, "");

    return `${API_ROOT}/storage/${cleanImage}`;
}

export default function OrderDetailsScreen({ route, navigation }) {
    const { orderId } = route.params || {};

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getOrderDetails(orderId);

            setOrder(response?.order || null);

            if (!response?.order) {
                setError("Order details could not be found.");
            }
        } catch (err) {
            console.log(
                "Order details error:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                    "Unable to load order details. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const formatPrice = (amount) => {
        const value = Number(amount);

        return `UGX ${
            (Number.isFinite(value) ? value : 0).toLocaleString("en-UG")
        }`;
    };

    const formatDate = (date) => {
        if (!date) return "Not available";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Not available";
        }

        return parsedDate.toLocaleString("en-UG", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusColor = (status) => {
        const value = String(status || "").toLowerCase();

        if (["completed", "delivered", "paid"].includes(value)) {
            return GREEN;
        }

        if (["cancelled", "failed", "rejected"].includes(value)) {
            return "#FF5252";
        }

        if (
            ["processing", "shipped", "out_for_delivery"].includes(value)
        ) {
            return "#40C4FF";
        }

        return "#FFB74D";
    };

    const StatusBadge = ({ status }) => {
        const statusColor = getStatusColor(status);

        return (
            <View
                style={[
                    styles.statusBadge,
                    {
                        borderColor: statusColor,
                        backgroundColor: statusColor + "18",
                    },
                ]}
            >
                <Text
                    style={[
                        styles.statusText,
                        { color: statusColor },
                    ]}
                >
                    {String(status || "Pending").replace(/_/g, " ")}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />

                <Text style={styles.loadingText}>
                    Loading order details...
                </Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>
                    {error || "Order not found."}
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadOrder}
                >
                    <Text style={styles.retryText}>TRY AGAIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>GO BACK</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const payment = order.payment;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backArrow}
                >
                    <Text style={styles.backArrowText}>‹</Text>
                </TouchableOpacity>

                <View style={styles.headerText}>
                    <Text style={styles.title}>ORDER DETAILS</Text>

                    <Text style={styles.subtitle}>
                        #{order.order_number}
                    </Text>
                </View>
            </View>

            {/* Order status */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeading}>
                    <Text style={styles.cardTitle}>ORDER STATUS</Text>

                    <StatusBadge status={order.status} />
                </View>

                <Text style={styles.dateLabel}>ORDER PLACED</Text>

                <Text style={styles.dateValue}>
                    {formatDate(order.created_at)}
                </Text>
            </View>

            {/* Products */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    PRODUCTS ({items.length})
                </Text>

                {items.length === 0 ? (
                    <Text style={styles.mutedText}>
                        No product information is available.
                    </Text>
                ) : (
                    items.map((item, index) => {
                        const product = item.product || {};
                        const imageUrl = getProductImageUrl(product);

                        return (
                            <View
                                key={item.id || index}
                                style={styles.productRow}
                            >
                                {/* Product image */}
                                <View style={styles.productImageContainer}>
                                    {imageUrl ? (
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={styles.productImage}
                                            resizeMode="cover"
                                            onError={() =>
                                                console.log(
                                                    "Product image failed:",
                                                    imageUrl
                                                )
                                            }
                                        />
                                    ) : (
                                        <View style={styles.imagePlaceholder}>
                                            <Text style={styles.placeholderText}>
                                                AC
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Product information */}
                                <View style={styles.productDetails}>
                                    <Text style={styles.productName}>
                                        {product.name ||
                                            product.product_name ||
                                            "Product"}
                                    </Text>

                                    <Text style={styles.productMeta}>
                                        Size: {item.size || "N/A"}
                                    </Text>

                                    <Text style={styles.productMeta}>
                                        Quantity: {item.quantity || 0}
                                    </Text>

                                    <Text style={styles.productMeta}>
                                        Unit price: {formatPrice(item.unit_price)}
                                    </Text>

                                    <Text style={styles.productSubtotal}>
                                        Subtotal: {formatPrice(item.subtotal)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>

            {/* Order summary */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>ORDER SUMMARY</Text>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>

                    <Text style={styles.summaryValue}>
                        {formatPrice(order.subtotal)}
                    </Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>TOTAL</Text>

                    <Text style={styles.totalValue}>
                        {formatPrice(order.total)}
                    </Text>
                </View>
            </View>

            {/* Payment information */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    PAYMENT INFORMATION
                </Text>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                        Payment method
                    </Text>

                    <Text style={styles.summaryValue}>
                        {String(order.payment_method || "Not specified")
                            .replace(/_/g, " ")
                            .toUpperCase()}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                        Payment status
                    </Text>

                    <StatusBadge
                        status={
                            order.payment_status ||
                            payment?.status ||
                            "Pending"
                        }
                    />
                </View>

                {payment?.provider && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                            Provider
                        </Text>

                        <Text style={styles.summaryValue}>
                            {payment.provider}
                        </Text>
                    </View>
                )}

                {payment?.reference_id && (
                    <View style={styles.paymentReference}>
                        <Text style={styles.summaryLabel}>
                            Payment reference
                        </Text>

                        <Text style={styles.referenceValue}>
                            {payment.reference_id}
                        </Text>
                    </View>
                )}

                {payment?.paid_at && (
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                            Paid on
                        </Text>

                        <Text style={styles.summaryValue}>
                            {formatDate(payment.paid_at)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Delivery information */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    DELIVERY INFORMATION
                </Text>

                <Text style={styles.dateLabel}>
                    SHIPPING ADDRESS
                </Text>

                <Text style={styles.addressText}>
                    {order.shipping_address ||
                        "No delivery address provided."}
                </Text>

                {order.notes ? (
                    <>
                        <Text style={styles.dateLabel}>
                            DELIVERY NOTES
                        </Text>

                        <Text style={styles.addressText}>
                            {order.notes}
                        </Text>
                    </>
                ) : null}
            </View>

            <Text style={styles.footer}>
                Thank you for shopping with Adrian Collections.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#090909",
    },

    content: {
        padding: 18,
        paddingBottom: 40,
    },

    center: {
        flex: 1,
        backgroundColor: "#090909",
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
    },

    loadingText: {
        color: "#AAAAAA",
        marginTop: 15,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 35,
        marginBottom: 25,
    },

    backArrow: {
        width: 43,
        height: 43,
        borderRadius: 12,
        backgroundColor: "#202020",
        justifyContent: "center",
        alignItems: "center",
    },

    backArrowText: {
        color: GREEN,
        fontSize: 35,
        lineHeight: 40,
    },

    headerText: {
        marginLeft: 15,
    },

    title: {
        color: GREEN,
        fontSize: 23,
        fontWeight: "900",
    },

    subtitle: {
        color: "#AAAAAA",
        fontSize: 12,
        marginTop: 4,
    },

    card: {
        backgroundColor: "#151515",
        borderRadius: 13,
        padding: 17,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#292929",
    },

    statusCard: {
        backgroundColor: "#151515",
        borderRadius: 13,
        padding: 17,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#292929",
    },

    statusHeading: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    cardTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
        marginBottom: 17,
    },

    statusBadge: {
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    statusText: {
        fontSize: 10,
        fontWeight: "900",
        textTransform: "capitalize",
    },

    dateLabel: {
        color: "#888888",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
        marginBottom: 7,
        marginTop: 10,
    },

    dateValue: {
        color: "#FFFFFF",
        fontSize: 13,
    },

    productRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        borderBottomWidth: 1,
        borderBottomColor: "#292929",
        paddingVertical: 15,
    },

    productImageContainer: {
        width: 95,
        height: 110,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#222222",
    },

    productImage: {
        width: "100%",
        height: "100%",
    },

    imagePlaceholder: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#252525",
    },

    placeholderText: {
        color: GREEN,
        fontSize: 23,
        fontWeight: "900",
    },

    productDetails: {
        flex: 1,
        marginLeft: 13,
    },

    productName: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 7,
    },

    productMeta: {
        color: "#999999",
        fontSize: 11,
        marginTop: 4,
    },

    productSubtotal: {
        color: GREEN,
        fontSize: 12,
        fontWeight: "900",
        marginTop: 8,
    },

    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    summaryLabel: {
        color: "#999999",
        fontSize: 12,
        flex: 1,
    },

    summaryValue: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
        textAlign: "right",
        flexShrink: 1,
    },

    summaryDivider: {
        height: 1,
        backgroundColor: "#333333",
        marginVertical: 5,
    },

    totalLabel: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 13,
    },

    totalValue: {
        color: GREEN,
        fontSize: 19,
        fontWeight: "900",
    },

    paymentReference: {
        marginBottom: 15,
    },

    referenceValue: {
        color: GREEN,
        fontSize: 12,
        marginTop: 7,
        fontWeight: "700",
    },

    addressText: {
        color: "#FFFFFF",
        fontSize: 13,
        lineHeight: 22,
        marginBottom: 12,
    },

    mutedText: {
        color: "#999999",
        fontSize: 13,
    },

    errorText: {
        color: "#FF5252",
        textAlign: "center",
        fontSize: 14,
    },

    retryButton: {
        backgroundColor: GREEN,
        paddingHorizontal: 25,
        paddingVertical: 13,
        borderRadius: 8,
        marginTop: 20,
    },

    retryText: {
        color: "#090909",
        fontWeight: "900",
    },

    backButton: {
        padding: 15,
        marginTop: 10,
    },

    backButtonText: {
        color: "#FFFFFF",
        fontWeight: "800",
    },

    footer: {
        color: "#777777",
        textAlign: "center",
        fontSize: 11,
        marginTop: 10,
        marginBottom: 15,
    },
});
