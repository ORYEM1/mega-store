import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen({ navigation }) {
    const loginCustomer = useAuthStore((state) => state.login);

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!login.trim() || !password) {
            Alert.alert("Missing information", "Enter your email/phone and password.");
            return;
        }

        setLoading(true);

        try {
            await loginCustomer(login.trim(), password);

            Alert.alert("Welcome back!", "You have successfully signed in.", [
                {
                    text: "Continue",
                    onPress: () => navigation.navigate("MainTabs", {
                        screen: "Account",
                    }),
                },
            ]);
        } catch (error) {
            const errors = error.response?.data?.errors;
            const firstError = errors
                ? Object.values(errors).flat()[0]
                : null;

            Alert.alert(
                "Login failed",
                firstError ||
                    error.response?.data?.message ||
                    "Incorrect email/phone or password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>← BACK</Text>
                </TouchableOpacity>

                <View style={styles.heading}>
                    <Text style={styles.brand}>MEGA STORE</Text>
                    <Text style={styles.title}>WELCOME BACK</Text>
                    <Text style={styles.subtitle}>
                        Sign in with your email address or phone number.
                    </Text>
                </View>

                <Text style={styles.label}>EMAIL OR PHONE NUMBER</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter email or phone number"
                    placeholderTextColor="#777777"
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#777777"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#090909" />
                    ) : (
                        <Text style={styles.loginButtonText}>SIGN IN</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.registerRow}>
                    <Text style={styles.registerText}>
                        Don't have an account?
                    </Text>

                    <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                        <Text style={styles.registerLink}> Register</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#090909",
    },
    content: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 25,
    },
    back: {
        color: "#C6FF00",
        fontWeight: "800",
        fontSize: 14,
    },
    heading: {
        marginTop: 65,
        marginBottom: 45,
    },
    brand: {
        color: "#C6FF00",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 3,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 25,
        fontWeight: "900",
        marginTop: 22,
    },
    subtitle: {
        color: "#999999",
        fontSize: 14,
        marginTop: 10,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 9,
        marginTop: 18,
    },
    input: {
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#333333",
        borderRadius: 10,
        padding: 16,
        color: "#FFFFFF",
        fontSize: 15,
    },
    loginButton: {
        backgroundColor: "#C6FF00",
        padding: 18,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 35,
    },
    disabledButton: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: "#090909",
        fontWeight: "900",
        fontSize: 15,
    },
    registerRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 28,
    },
    registerText: {
        color: "#999999",
    },
    registerLink: {
        color: "#C6FF00",
        fontWeight: "900",
    },
});