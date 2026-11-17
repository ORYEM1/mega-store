import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
} from "react-native";

import api from "../services/api";
import colors from "../theme/colors";
import { useCartStore } from "../store/cartStore";

export default function PaymentPendingScreen({ route, navigation }) {
    const { referenceId, orderNumber } = route.params || {};

    const clearCart = useCartStore((state) => state.clearCart);

    const [status, setStatus] = useState("pending");
    const [message, setMessage] = useState(
        "Waiting for MTN Mobile Money payment confirmation."
    );
    const [checking, setChecking] = useState(true);

    const timerRef = useRef(null);
    const stoppedRef = useRef(false);
    const attemptsRef = useRef(0);

    useEffect(() => {
        if (!referenceId) {
            setStatus("error");
            setMessage("Payment reference is missing.");
            setChecking(false);
            return;
        }

        stoppedRef.current = false;

        const checkPayment = async () => {
            if (stoppedRef.current) return;

            try {
                attemptsRef.current += 1;

                const response = await api.get(
                    `/payments/${encodeURIComponent(referenceId)}/status`
                );

                const result = response.data;
                const paymentStatus = result.payment_status;

                setMessage(
                    result.message ||
                    "Checking your payment status..."
                );

                if (paymentStatus === "paid") {
                    stoppedRef.current = true;
                    setStatus("paid");
                    setChecking(false);
                    clearCart();
                    return;
                }

                if (paymentStatus === "failed") {
                    stoppedRef.current = true;
                    setStatus("failed");
                    setChecking(false);
                    return;
                }

                if (attemptsRef.current >= 60) {
                    stoppedRef.current = true;
                    setStatus("pending_timeout");
                    setChecking(false);
                    setMessage(
                        "We have not received confirmation yet. Your payment may still be processing. You can check again."
                    );
                    return;
                }
            } catch (error) {
                console.log(
                    "Payment status error:",
                    error.response?.data || error.message
                );

                setMessage(
                    error.response?.data?.message ||
                    "Unable to check payment right now. We will try again."
                );
            }

            if (!stoppedRef.current) {
                timerRef.current = setTimeout(checkPayment, 5000);
            }
        };

        checkPayment();

        return () => {
            stoppedRef.current = true;

            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [referenceId, clearCart]);

    const retryChecking = () => {
        attemptsRef.current = 0;
        stoppedRef.current = false;
        setStatus("pending");
        setChecking(true);
        setMessage("Checking your payment status...");

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        const checkAgain = async () => {
            try {
                const response = await api.get(
                    `/payments/${encodeURIComponent(referenceId)}/status`
                );

                const result = response.data;

                setMessage(result.message || "Checking payment...");

                if (result.payment_status === "paid") {
                    stoppedRef.current = true;
                    setStatus("paid");
                    setChecking(false);
                    clearCart();
                    return;
                }

                if (result.payment_status === "failed") {
                    stoppedRef.current = true;
                    setStatus("failed");
                    setChecking(false);
                    return;
                }
            } catch (error) {
                setMessage(
                    error.response?.data?.message ||
                    "Unable to check payment right now."
                );
            }

            if (!stoppedRef.current) {
                timerRef.current = setTimeout(checkAgain, 5000);
            }
        };

        checkAgain();
    };

    const goShopping = () => {
        navigation.navigate("MainTabs", {
            screen: "Home",
        });
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
        >
            {status === "paid" ? (
                <>
                    <Text style={styles.successIcon}>✓</Text>

                    <Text style={styles.title}>
                        PAYMENT SUCCESSFUL
                    </Text>

                    <Text style={styles.description}>
                        Your MTN Mobile Money payment has been confirmed.
                        Your order is now ready for processing.
                    </Text>

                    <Text style={styles.orderNumber}>
                        Order: {orderNumber || "Confirmed"}
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={goShopping}
                    >
                        <Text style={styles.primaryButtonText}>
                            CONTINUE SHOPPING
                        </Text>
                    </TouchableOpacity>
                </>
            ) : status === "failed" ? (
                <>
                    <Text style={styles.failedIcon}>!</Text>

                    <Text style={styles.title}>
                        PAYMENT FAILED
                    </Text>

                    <Text style={styles.description}>
                        {message}
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={goShopping}
                    >
                        <Text style={styles.primaryButtonText}>
                            RETURN TO SHOP
                        </Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <ActivityIndicator
                        size="large"
                        color={colors.primary}
                        style={styles.loader}
                    />

                    <Text style={styles.title}>
                        {status === "pending_timeout"
                            ? "PAYMENT STILL PENDING"
                            : "WAITING FOR PAYMENT"}
                    </Text>

                    <Text style={styles.description}>
                        {message}
                    </Text>

                    <Text style={styles.orderNumber}>
                        Order: {orderNumber || "Processing"}
                    </Text>

                    <Text style={styles.reference}>
                        Payment Reference:
                        {"\n"}
                        {referenceId || "Not available"}
                    </Text>

                    {status === "pending_timeout" && (
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={retryChecking}
                        >
                            <Text style={styles.primaryButtonText}>
                                CHECK PAYMENT AGAIN
                            </Text>
                        </TouchableOpacity>
                    )}

                    {checking && (
                        <Text style={styles.waitText}>
                            Please wait. Do not make another payment.
                        </Text>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
    },

    loader: {
        marginBottom: 30,
    },

    successIcon: {
        color: colors.primary,
        fontSize: 80,
        fontWeight: "900",
        marginBottom: 20,
    },

    failedIcon: {
        color: "#FF5252",
        fontSize: 80,
        fontWeight: "900",
        marginBottom: 20,
    },

    title: {
        color: colors.primary,
        fontSize: 25,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 15,
    },

    description: {
        color: colors.text,
        fontSize: 15,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 25,
    },

    orderNumber: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 20,
    },

    reference: {
        color: colors.muted,
        textAlign: "center",
        fontSize: 12,
        marginBottom: 25,
    },

    waitText: {
        color: colors.muted,
        fontSize: 12,
        textAlign: "center",
        marginTop: 20,
    },

    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 25,
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
        marginTop: 15,
    },

    primaryButtonText: {
        color: "#000000",
        fontWeight: "900",
        fontSize: 14,
    },
});
