import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    FlatList,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCartStore } from "../store/cartStore";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

const formatPrice = (amount) =>
    new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

function getImageUrl(photo) {
    if (!photo) return null;

    if (photo.startsWith("http")) {
        return photo;
    }

    return `${API_URL}/storage/${photo.replace(/^\/+/, "")}`;
}

export default function CartScreen() {
    const navigation = useNavigation();

    const items = useCartStore((state) => state.items);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const updateQuantity = useCartStore((state) => state.updateQuantity);

    const total = items.reduce((sum, item) => {
        const price = Number(item.product?.price || item.price || 0);
        return sum + price * Number(item.quantity || 1);
    }, 0);

    const itemCount = items.reduce(
        (sum, item) => sum + Number(item.quantity || 1),
        0
    );

    const handleRemove = (item) => {
        Alert.alert(
            "Remove item",
            "Are you sure you want to remove this item from your cart?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () =>
                        removeFromCart(item.productId, item.size),
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const product = item.product || {};
        const price = Number(product.price || item.price || 0);
        const image = getImageUrl(product.photo || item.photo);

        return (
            <View style={styles.cartItem}>
                {image ? (
                    <Image
                        source={{ uri: image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.productImage, styles.imagePlaceholder]}>
                        <Text style={styles.placeholderText}>MS</Text>
                    </View>
                )}

                <View style={styles.itemDetails}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {product.name || item.name || "Product"}
                    </Text>

                    {item.size ? (
                        <Text style={styles.sizeText}>
                            Size: {item.size}
                        </Text>
                    ) : null}

                    <Text style={styles.price}>
                        {formatPrice(price)}
                    </Text>

                    <View style={styles.itemActions}>
                        <View style={styles.quantityControls}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() =>
                                    updateQuantity(
                                        item.productId,
                                        item.size,
                                        Math.max(1, Number(item.quantity) - 1)
                                    )
                                }
                            >
                                <Text style={styles.quantityButtonText}>−</Text>
                            </TouchableOpacity>

                            <Text style={styles.quantity}>
                                {item.quantity}
                            </Text>

                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() =>
                                    updateQuantity(
                                        item.productId,
                                        item.size,
                                        Number(item.quantity) + 1
                                    )
                                }
                            >
                                <Text style={styles.quantityButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity onPress={() => handleRemove(item)}>
                            <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (items.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🛍</Text>

                <Text style={styles.emptyTitle}>Your cart is empty</Text>

                <Text style={styles.emptyDescription}>
                    You haven't added anything to your cart yet.
                </Text>

                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() =>
                        navigation.navigate("MainTabs", { screen: "Shop" })
                    }
                >
                    <Text style={styles.shopButtonText}>START SHOPPING</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>MY CART</Text>
                <Text style={styles.itemCount}>
                    {itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"}
                </Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) =>
                    `${item.productId}-${item.size || "default"}`
                }
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <View style={styles.summary}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalAmount}>
                        {formatPrice(total)}
                    </Text>
                </View>

                <Text style={styles.shippingNote}>
                    Delivery fees will be calculated at checkout.
                </Text>

                <TouchableOpacity
                    style={styles.checkoutButton}
                    onPress={() => {
                        const token = require("../store/authStore")
                            .useAuthStore.getState().token;
                    
                        if (!token) {
                            navigation.navigate("Login");
                            return;
                        }
                    
                        navigation.navigate("Checkout");
                    }}
                >
                    <Text style={styles.checkoutButtonText}>
                        PROCEED TO CHECKOUT
                    </Text>
                </TouchableOpacity>
            </View>
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
        paddingTop: 22,
        paddingBottom: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heading: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 1,
    },
    itemCount: {
        color: "#C6FF00",
        fontSize: 12,
        fontWeight: "800",
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    cartItem: {
        flexDirection: "row",
        backgroundColor: "#171717",
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#292929",
    },
    productImage: {
        width: 105,
        height: 120,
        borderRadius: 10,
        backgroundColor: "#252525",
    },
    imagePlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        color: "#C6FF00",
        fontSize: 24,
        fontWeight: "900",
    },
    itemDetails: {
        flex: 1,
        marginLeft: 13,
        justifyContent: "space-between",
    },
    productName: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    sizeText: {
        color: "#AAAAAA",
        fontSize: 12,
        marginTop: 5,
    },
    price: {
        color: "#C6FF00",
        fontSize: 15,
        fontWeight: "900",
        marginTop: 8,
    },
    itemActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#252525",
        borderRadius: 8,
    },
    quantityButton: {
        width: 32,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },
    quantityButtonText: {
        color: "#C6FF00",
        fontSize: 20,
        fontWeight: "800",
    },
    quantity: {
        color: "#FFFFFF",
        minWidth: 25,
        textAlign: "center",
        fontWeight: "800",
    },
    removeText: {
        color: "#FF6868",
        fontSize: 12,
        fontWeight: "700",
    },
    summary: {
        backgroundColor: "#171717",
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#292929",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
    totalAmount: {
        color: "#C6FF00",
        fontSize: 21,
        fontWeight: "900",
    },
    shippingNote: {
        color: "#999999",
        fontSize: 12,
        marginTop: 8,
        marginBottom: 18,
    },
    checkoutButton: {
        backgroundColor: "#C6FF00",
        paddingVertical: 17,
        borderRadius: 10,
        alignItems: "center",
    },
    checkoutButtonText: {
        color: "#090909",
        fontSize: 14,
        fontWeight: "900",
        letterSpacing: 1,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: "#090909",
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
    },
    emptyIcon: {
        fontSize: 55,
        marginBottom: 20,
    },
    emptyTitle: {
        color: "#FFFFFF",
        fontSize: 23,
        fontWeight: "900",
    },
    emptyDescription: {
        color: "#999999",
        fontSize: 14,
        textAlign: "center",
        marginTop: 10,
        marginBottom: 25,
    },
    shopButton: {
        backgroundColor: "#C6FF00",
        paddingHorizontal: 28,
        paddingVertical: 15,
        borderRadius: 9,
    },
    shopButtonText: {
        color: "#090909",
        fontWeight: "900",
        fontSize: 13,
    },
});
