import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { getOrders } from "../services/storeService";

const GREEN = "#C6FF00";

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadOrders = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            setError("");

            const response = await getOrders();

            const data = response?.orders?.data;

            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log("Orders error:", err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                "Unable to load your orders. Please try again."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [])
    );

    const refreshOrders = () => {
        setRefreshing(true);
        loadOrders(false);
    };

    const formatPrice = (amount) => {
        return `UGX ${Number(amount || 0).toLocaleString("en-UG")}`;
    };

    const getStatusColor = (status) => {
        const value = String(status || "").toLowerCase();

        if (["completed", "delivered"].includes(value)) {
            return GREEN;
        }

        if (["cancelled", "failed"].includes(value)) {
            return "#FF5252";
        }

        if (["processing", "shipped"].includes(value)) {
            return "#40C4FF";
        }

        return "#FFB74D";
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            activeOpacity={0.8}
            onPress={() =>
                navigation.navigate("OrderDetails", {
                    orderId: item.orders_id,
                })
            }
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderLabel}>ORDER NUMBER</Text>

                    <Text style={styles.orderNumber}>
                        #{item.order_number}
                    </Text>
                </View>

                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                getStatusColor(item.status) + "22",
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                        ]}
                    >
                        {item.status || "Pending"}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.orderInfo}>
                <View>
                    <Text style={styles.infoLabel}>ITEMS</Text>

                    <Text style={styles.infoValue}>
                        {item.items?.length || 0} products
                    </Text>
                </View>

                <View>
                    <Text style={styles.infoLabel}>TOTAL</Text>

                    <Text style={styles.price}>
                        {formatPrice(item.total)}
                    </Text>
                </View>
            </View>

            <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>
                    Payment: {item.payment_status || "Pending"}
                </Text>

                <Text style={styles.viewDetails}>
                    View details →
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={GREEN} />

                <Text style={styles.loadingText}>
                    Loading your orders...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>MY ORDERS</Text>

                <Text style={styles.subtitle}>
                    Track and manage your purchases.
                </Text>
            </View>

            {error ? (
                <View style={styles.center}>
                    <Text style={styles.error}>{error}</Text>

                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => loadOrders()}
                    >
                        <Text style={styles.retryText}>TRY AGAIN</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => String(item.orders_id)}
                    renderItem={renderOrder}
                    contentContainerStyle={[
                        styles.list,
                        orders.length === 0 && styles.emptyList,
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshOrders}
                            tintColor={GREEN}
                            colors={[GREEN]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🛍</Text>

                            <Text style={styles.emptyTitle}>
                                No orders yet
                            </Text>

                            <Text style={styles.emptyDescription}>
                                Your purchases will appear here.
                            </Text>

                            <TouchableOpacity
                                style={styles.shopButton}
                                onPress={() =>
                                    navigation.navigate("MainTabs", {
                                        screen: "Shop",
                                    })
                                }
                            >
                                <Text style={styles.shopButtonText}>
                                    START SHOPPING
                                </Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#090909",
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 20,
    },

    title: {
        color: GREEN,
        fontSize: 27,
        fontWeight: "900",
        letterSpacing: 1,
    },

    subtitle: {
        color: "#999",
        marginTop: 6,
        fontSize: 13,
    },

    list: {
        padding: 16,
        paddingBottom: 30,
    },

    orderCard: {
        backgroundColor: "#151515",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#292929",
    },

    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    orderLabel: {
        color: "#888",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
    },

    orderNumber: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "900",
        marginTop: 5,
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
    },

    statusText: {
        fontSize: 11,
        fontWeight: "900",
        textTransform: "capitalize",
    },

    divider: {
        height: 1,
        backgroundColor: "#292929",
        marginVertical: 16,
    },

    orderInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    infoLabel: {
        color: "#888",
        fontSize: 10,
        fontWeight: "800",
    },

    infoValue: {
        color: "#FFF",
        fontSize: 14,
        marginTop: 6,
    },

    price: {
        color: GREEN,
        fontSize: 16,
        fontWeight: "900",
        marginTop: 5,
    },

    paymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 17,
    },

    paymentLabel: {
        color: "#AAA",
        fontSize: 11,
        textTransform: "capitalize",
    },

    viewDetails: {
        color: GREEN,
        fontSize: 12,
        fontWeight: "800",
    },

    center: {
        flex: 1,
        backgroundColor: "#090909",
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
    },

    loadingText: {
        color: "#AAA",
        marginTop: 12,
    },

    error: {
        color: "#FF5252",
        textAlign: "center",
    },

    retryButton: {
        backgroundColor: GREEN,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 18,
    },

    retryText: {
        color: "#090909",
        fontWeight: "900",
    },

    emptyList: {
        flexGrow: 1,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyIcon: {
        fontSize: 55,
        marginBottom: 15,
    },

    emptyTitle: {
        color: "#FFF",
        fontSize: 21,
        fontWeight: "900",
    },

    emptyDescription: {
        color: "#888",
        marginTop: 8,
        fontSize: 13,
    },

    shopButton: {
        backgroundColor: GREEN,
        paddingHorizontal: 25,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 22,
    },

    shopButtonText: {
        color: "#090909",
        fontWeight: "900",
        fontSize: 12,
    },
});
