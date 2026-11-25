import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";

import api from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

const formatPrice = (amount) =>
    new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

export default function CheckoutScreen({ navigation }) {
    const customer = useAuthStore((state) => state.customer);

    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);

    const [address, setAddress] = useState(customer?.address || "");
    const [city, setCity] = useState(customer?.city || "");
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [mobileMoneyPhone, setMobileMoneyPhone] = useState(
        customer?.phone || ""
    );
    const [loading, setLoading] = useState(false);
    const [orderResult, setOrderResult] = useState(null);

    const subtotal = items.reduce((total, item) => {
        const product = item.product || {};
        return total +
            Number(product.price || item.price || 0) *
            Number(item.quantity || 1);
    }, 0);

    const handlePlaceOrder = async () => {
        if (!items.length) {
            Alert.alert("Your cart is empty", "Add products before checkout.");
            return;
        }

        if (!address.trim()) {
            Alert.alert("Delivery address required", "Enter your delivery address.");
            return;
        }

        if (!city.trim()) {
            Alert.alert("City required", "Enter your delivery city.");
            return;
        }

        if (
            paymentMethod === "mobile_money" &&
            !/^2567[0-9]{8}$/.test(mobileMoneyPhone.trim())
        ) {
            Alert.alert(
                "Invalid phone number",
                "Enter an MTN Uganda number in this format: 2567XXXXXXXX."
            );
            return;
        }

        const shippingAddress = `${address.trim()}, ${city.trim()}`;

        const payload = {
            items: items.map((item) => ({
                product_id: Number(item.productId),
                size: item.size || null,
                quantity: Number(item.quantity),
            })),
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
            notes: notes.trim() || null,
        };

        if (paymentMethod === "mobile_money") {
            payload.mobile_money_provider = "mtn_momo";
            payload.mobile_money_phone = mobileMoneyPhone.trim();
        }

        setLoading(true);

        try {
            const response = await api.post("/orders", payload);
            const result = response.data;

            if (paymentMethod === "mobile_money") {
                // Keep the cart until payment is confirmed.
                setOrderResult({
                    type: "pending",
                    order: result.order,
                    payment: result.payment,
                    message: result.message,
                });
            } else {
                clearCart();

                setOrderResult({
                    type: "success",
                    order: result.order,
                    message: result.message,
                });
            }
        } catch (error) {
            const responseData = error.response?.data;
            const validationErrors = responseData?.errors;
            const firstError = validationErrors
                ? Object.values(validationErrors).flat()[0]
                : null;

            // The backend may have created an order but failed to initiate payment.
            if (responseData?.order && error.response?.status === 502) {
                setOrderResult({
                    type: "failed",
                    order: responseData.order,
                    payment: responseData.payment,
                    message: responseData.message,
                });
            } else {
                Alert.alert(
                    "Unable to place order",
                    firstError ||
                        responseData?.message ||
                        "Please check your connection and try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    if (orderResult) {
        const isPending = orderResult.type === "pending";
        const isFailed = orderResult.type === "failed";

        return (
            <View style={styles.resultContainer}>
                <Text style={styles.resultIcon}>
                    {isPending ? "📱" : isFailed ? "⚠️" : "✓"}
                </Text>

                <Text style={styles.resultTitle}>
                    {isPending
                        ? "PAYMENT REQUEST SENT"
                        : isFailed
                        ? "PAYMENT NOT INITIATED"
                        : "ORDER PLACED!"}
                </Text>

                <Text style={styles.resultMessage}>
                    {orderResult.message}
                </Text>

                <View style={styles.orderCard}>
                    <Text style={styles.orderLabel}>ORDER NUMBER</Text>
                    <Text style={styles.orderNumber}>
                        {orderResult.order?.order_number || "Not available"}
                    </Text>

                    <Text style={styles.orderLabel}>TOTAL</Text>
                    <Text style={styles.orderTotal}>
                        {formatPrice(orderResult.order?.total)}
                    </Text>

                    {orderResult.payment?.reference_id ? (
                        <>
                            <Text style={styles.orderLabel}>
                                PAYMENT REFERENCE
                            </Text>
                            <Text style={styles.reference}>
                                {orderResult.payment.reference_id}
                            </Text>
                        </>
                    ) : null}
                </View>

                {isPending ? (
                    <Text style={styles.pendingNote}>
                        Check your MTN phone and approve the payment request.
                        Do not place the same order again while this payment
                        is pending.
                    </Text>
                ) : null}

                {isFailed ? (
                    <Text style={styles.pendingNote}>
                        Your order was received, but payment initiation failed.
                        Contact customer support before attempting another payment.
                    </Text>
                ) : null}

                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => navigation.navigate("MainTabs", {
                        screen: "Home",
                    })}
                >
                    <Text style={styles.doneButtonText}>
                        RETURN TO HOME
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← BACK TO CART</Text>
                </TouchableOpacity>

                <Text style={styles.heading}>CHECKOUT</Text>
                <Text style={styles.subtitle}>
                    Complete your delivery and payment details.
                </Text>

                <Text style={styles.sectionTitle}>DELIVERY DETAILS</Text>

                <Text style={styles.label}>DELIVERY ADDRESS *</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="House number, street, area or landmark"
                    placeholderTextColor="#777777"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                />

                <Text style={styles.label}>CITY / TOWN *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="For example, Kampala"
                    placeholderTextColor="#777777"
                    value={city}
                    onChangeText={setCity}
                />

                <Text style={styles.label}>ORDER NOTES</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Additional delivery instructions (optional)"
                    placeholderTextColor="#777777"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                />

                <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>

                <TouchableOpacity
                    style={[
                        styles.paymentOption,
                        paymentMethod === "cash" && styles.selectedPayment,
                    ]}
                    onPress={() => setPaymentMethod("cash")}
                >
                    <View style={styles.radio}>
                        {paymentMethod === "cash" && (
                            <View style={styles.radioSelected} />
                        )}
                    </View>

                    <View style={styles.paymentDetails}>
                        <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                        <Text style={styles.paymentDescription}>
                            Pay when your order is delivered.
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.paymentOption,
                        paymentMethod === "mobile_money" && styles.selectedPayment,
                    ]}
                    onPress={() => setPaymentMethod("mobile_money")}
                >
                    <View style={styles.radio}>
                        {paymentMethod === "mobile_money" && (
                            <View style={styles.radioSelected} />
                        )}
                    </View>

                    <View style={styles.paymentDetails}>
                        <Text style={styles.paymentTitle}>MTN Mobile Money</Text>
                        <Text style={styles.paymentDescription}>
                            Approve a payment request on your MTN phone.
                        </Text>
                    </View>
                </TouchableOpacity>

                {paymentMethod === "mobile_money" && (
                    <>
                        <Text style={styles.label}>MTN PHONE NUMBER *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="2567XXXXXXXX"
                            placeholderTextColor="#777777"
                            value={mobileMoneyPhone}
                            onChangeText={setMobileMoneyPhone}
                            keyboardType="phone-pad"
                            maxLength={12}
                        />

                        <Text style={styles.phoneHint}>
                            Enter your number starting with 256, for example
                            2567XXXXXXXX. Airtel Money is not available yet.
                        </Text>
                    </>
                )}

                <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>

                {items.map((item) => {
                    const product = item.product || {};
                    const price = Number(product.price || item.price || 0);

                    return (
                        <View
                            key={`${item.productId}-${item.size || "default"}`}
                            style={styles.summaryItem}
                        >
                            <View style={styles.summaryProduct}>
                                <Text style={styles.summaryName}>
                                    {product.name || item.name || "Product"}
                                </Text>

                                <Text style={styles.summaryMeta}>
                                    {item.size ? `Size ${item.size} · ` : ""}
                                    Qty: {item.quantity}
                                </Text>
                            </View>

                            <Text style={styles.summaryPrice}>
                                {formatPrice(price * Number(item.quantity))}
                            </Text>
                        </View>
                    );
                })}

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Estimated total</Text>
                    <Text style={styles.totalAmount}>
                        {formatPrice(subtotal)}
                    </Text>
                </View>

                <Text style={styles.shippingNote}>
                    Delivery charges, if applicable, will be confirmed by the store.
                </Text>

                <TouchableOpacity
                    style={[
                        styles.placeOrderButton,
                        loading && styles.disabledButton,
                    ]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#090909" />
                    ) : (
                        <Text style={styles.placeOrderText}>
                            {paymentMethod === "mobile_money"
                                ? "PLACE ORDER & REQUEST PAYMENT"
                                : "PLACE ORDER"}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#090909",
    },
    content: {
        padding: 20,
        paddingBottom: 45,
    },
    back: {
        color: "#C6FF00",
        fontWeight: "800",
        fontSize: 13,
        marginBottom: 25,
    },
    heading: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "900",
    },
    subtitle: {
        color: "#999999",
        marginTop: 7,
        marginBottom: 28,
        fontSize: 13,
    },
    sectionTitle: {
        color: "#C6FF00",
        fontSize: 14,
        fontWeight: "900",
        marginTop: 25,
        marginBottom: 15,
        letterSpacing: 0.5,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "800",
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#333333",
        borderRadius: 10,
        padding: 15,
        color: "#FFFFFF",
        fontSize: 14,
    },
    multilineInput: {
        minHeight: 75,
        textAlignVertical: "top",
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#333333",
        padding: 16,
        borderRadius: 10,
        marginBottom: 12,
    },
    selectedPayment: {
        borderColor: "#C6FF00",
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#C6FF00",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 13,
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#C6FF00",
    },
    paymentDetails: {
        flex: 1,
    },
    paymentTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "800",
    },
    paymentDescription: {
        color: "#999999",
        fontSize: 12,
        marginTop: 5,
    },
    phoneHint: {
        color: "#999999",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 8,
    },
    summaryItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#292929",
    },
    summaryProduct: {
        flex: 1,
        marginRight: 10,
    },
    summaryName: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
    summaryMeta: {
        color: "#999999",
        fontSize: 12,
        marginTop: 5,
    },
    summaryPrice: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 22,
    },
    totalLabel: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
    totalAmount: {
        color: "#C6FF00",
        fontSize: 21,
        fontWeight: "900",
    },
    shippingNote: {
        color: "#999999",
        fontSize: 11,
        marginTop: 8,
    },
    placeOrderButton: {
        backgroundColor: "#C6FF00",
        padding: 18,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 25,
    },
    disabledButton: {
        opacity: 0.6,
    },
    placeOrderText: {
        color: "#090909",
        fontWeight: "900",
        fontSize: 13,
        textAlign: "center",
    },
    resultContainer: {
        flex: 1,
        backgroundColor: "#090909",
        padding: 25,
        justifyContent: "center",
        alignItems: "center",
    },
    resultIcon: {
        color: "#C6FF00",
        fontSize: 55,
        marginBottom: 20,
    },
    resultTitle: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "900",
        textAlign: "center",
    },
    resultMessage: {
        color: "#AAAAAA",
        textAlign: "center",
        lineHeight: 22,
        marginTop: 12,
    },
    orderCard: {
        width: "100%",
        backgroundColor: "#171717",
        padding: 20,
        borderRadius: 12,
        marginTop: 25,
    },
    orderLabel: {
        color: "#999999",
        fontSize: 11,
        fontWeight: "800",
        marginTop: 12,
    },
    orderNumber: {
        color: "#C6FF00",
        fontSize: 17,
        fontWeight: "900",
        marginTop: 5,
    },
    orderTotal: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "900",
        marginTop: 5,
    },
    reference: {
        color: "#FFFFFF",
        fontSize: 12,
        marginTop: 5,
    },
    pendingNote: {
        color: "#E5C46A",
        textAlign: "center",
        fontSize: 12,
        lineHeight: 19,
        marginTop: 20,
    },
    doneButton: {
        width: "100%",
        backgroundColor: "#C6FF00",
        padding: 17,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 25,
    },
    doneButtonText: {
        color: "#090909",
        fontWeight: "900",
    },
});
