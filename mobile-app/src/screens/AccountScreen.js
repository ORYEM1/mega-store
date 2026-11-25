import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useAuthStore } from "../store/authStore";

export default function AccountScreen({ navigation }) {
    const customer = useAuthStore((state) => state.customer);
    const token = useAuthStore((state) => state.token);
    const logout = useAuthStore((state) => state.logout);
    const fetchCustomer = useAuthStore((state) => state.fetchCustomer);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchCustomer().catch((error) => {
                console.log("Could not load customer:", error.message);
            });
        }
    }, [token]);

    const handleLogout = () => {
        Alert.alert("Sign out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign out",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);

                    try {
                        await logout();
                    } catch (error) {
                        Alert.alert(
                            "Sign out",
                            "Your local session has been cleared."
                        );
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const handleOrders = () => {
        navigation.navigate("Orders");
    };

    if (token && !customer) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#C6FF00" />
                <Text style={styles.loadingText}>Loading your account...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <View style={styles.header}>
                <Text style={styles.brand}>MEGA STORE</Text>
                <Text style={styles.subtitle}>COLLECTIONS</Text>
            </View>

            {customer ? (
                <>
                    <View style={styles.profile}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {(customer.first_name || "A")
                                    .charAt(0)
                                    .toUpperCase()}
                            </Text>
                        </View>

                        <Text style={styles.welcome}>
                            {customer.first_name} {customer.last_name}
                        </Text>

                        <Text style={styles.description}>
                            {customer.email || customer.phone}
                        </Text>
                    </View>

                    <View style={styles.details}>
                        <Text style={styles.sectionTitle}>
                            ACCOUNT DETAILS
                        </Text>

                        <Text style={styles.detailLabel}>Full name</Text>
                        <Text style={styles.detailValue}>
                            {customer.first_name} {customer.last_name}
                        </Text>

                        <Text style={styles.detailLabel}>Email address</Text>
                        <Text style={styles.detailValue}>
                            {customer.email || "Not provided"}
                        </Text>

                        <Text style={styles.detailLabel}>Phone number</Text>
                        <Text style={styles.detailValue}>
                            {customer.phone || "Not provided"}
                        </Text>
                    </View>

                    {/* Order History */}
                    <TouchableOpacity
                        style={styles.ordersButton}
                        onPress={handleOrders}
                        activeOpacity={0.8}
                    >
                        <View style={styles.ordersIcon}>
                            <Text style={styles.ordersIconText}>▤</Text>
                        </View>

                        <View style={styles.ordersContent}>
                            <Text style={styles.ordersTitle}>
                                ORDER HISTORY
                            </Text>

                            <Text style={styles.ordersDescription}>
                                View your orders and track their status
                            </Text>
                        </View>

                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.logoutButtonText}>
                                SIGN OUT
                            </Text>
                        )}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <View style={styles.profile}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>AC</Text>
                        </View>

                        <Text style={styles.welcome}>
                            WELCOME TO MEGA STORE
                        </Text>

                        <Text style={styles.description}>
                            Sign in to manage your account, track orders and
                            enjoy a better shopping experience.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.primaryButtonText}>
                            SIGN IN
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate("Register")}
                    >
                        <Text style={styles.secondaryButtonText}>
                            CREATE AN ACCOUNT
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.features}>
                        <Text style={styles.sectionTitle}>
                            ACCOUNT BENEFITS
                        </Text>

                        <Text style={styles.feature}>
                            ✓ Track your orders
                        </Text>
                        <Text style={styles.feature}>
                            ✓ Manage delivery details
                        </Text>
                        <Text style={styles.feature}>
                            ✓ View your order history
                        </Text>
                        <Text style={styles.feature}>
                            ✓ Enjoy faster checkout
                        </Text>
                    </View>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#090909",
        paddingHorizontal: 22,
    },
    contentContainer: {
        paddingBottom: 30,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#090909",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: "#AAAAAA",
        marginTop: 15,
    },
    header: {
        alignItems: "center",
        marginTop: 35,
        marginBottom: 45,
    },
    brand: {
        color: "#C6FF00",
        fontSize: 35,
        fontWeight: "900",
        letterSpacing: 3,
    },
    subtitle: {
        color: "#FFFFFF",
        fontSize: 12,
        letterSpacing: 5,
        marginTop: 4,
    },
    profile: {
        alignItems: "center",
        marginBottom: 35,
    },
    avatar: {
        width: 95,
        height: 95,
        borderRadius: 50,
        backgroundColor: "#C6FF00",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 22,
    },
    avatarText: {
        color: "#090909",
        fontSize: 30,
        fontWeight: "900",
    },
    welcome: {
        color: "#FFFFFF",
        fontSize: 21,
        fontWeight: "900",
        textAlign: "center",
    },
    description: {
        color: "#999999",
        textAlign: "center",
        lineHeight: 22,
        marginTop: 12,
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: "#C6FF00",
        padding: 17,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 13,
    },
    primaryButtonText: {
        color: "#090909",
        fontWeight: "900",
        fontSize: 14,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: "#C6FF00",
        padding: 17,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 13,
    },
    secondaryButtonText: {
        color: "#C6FF00",
        fontWeight: "900",
        fontSize: 14,
    },
    features: {
        marginTop: 35,
        marginBottom: 30,
    },
    sectionTitle: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "900",
        marginBottom: 18,
    },
    feature: {
        color: "#AAAAAA",
        fontSize: 14,
        marginBottom: 14,
    },
    details: {
        backgroundColor: "#171717",
        borderRadius: 12,
        padding: 18,
        marginBottom: 20,
    },
    detailLabel: {
        color: "#999999",
        fontSize: 12,
        marginTop: 16,
    },
    detailValue: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
        marginTop: 5,
    },
    ordersButton: {
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#333333",
        borderRadius: 12,
        padding: 18,
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
    },
    ordersIcon: {
        width: 45,
        height: 45,
        borderRadius: 10,
        backgroundColor: "#C6FF00",
        justifyContent: "center",
        alignItems: "center",
    },
    ordersIconText: {
        color: "#090909",
        fontSize: 25,
        fontWeight: "900",
    },
    ordersContent: {
        flex: 1,
        marginLeft: 14,
    },
    ordersTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "900",
    },
    ordersDescription: {
        color: "#999999",
        fontSize: 12,
        marginTop: 5,
    },
    arrow: {
        color: "#C6FF00",
        fontSize: 30,
        fontWeight: "bold",
    },
    logoutButton: {
        backgroundColor: "#292929",
        padding: 17,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 35,
    },
    logoutButtonText: {
        color: "#FFFFFF",
        fontWeight: "900",
        fontSize: 14,
    },
});