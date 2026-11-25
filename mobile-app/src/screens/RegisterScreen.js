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

export default function RegisterScreen({ navigation }) {
    const register = useAuthStore((state) => state.register);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!firstName.trim() || !lastName.trim() || !phone.trim() || !password) {
            Alert.alert(
                "Missing information",
                "Please complete your first name, last name, phone number and password."
            );
            return;
        }

        if (password.length < 8) {
            Alert.alert("Weak password", "Your password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Password mismatch", "Your passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await register({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim() || null,
                phone: phone.trim(),
                password,
                password_confirmation: confirmPassword,
            });

            Alert.alert(
                "Welcome!",
                "Your Adrian Collections account has been created.",
                [
                    {
                        text: "Continue",
                        onPress: () => navigation.navigate("MainTabs", {
                            screen: "Account",
                        }),
                    },
                ]
            );
        } catch (error) {
            const errors = error.response?.data?.errors;
            const firstError = errors
                ? Object.values(errors).flat()[0]
                : null;

            Alert.alert(
                "Registration failed",
                firstError ||
                    error.response?.data?.message ||
                    "Unable to create your account. Please try again."
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
                    <Text style={styles.title}>CREATE ACCOUNT</Text>
                    <Text style={styles.subtitle}>
                        Join Mega Store Collections and start shopping.
                    </Text>
                </View>

                <Text style={styles.label}>FIRST NAME *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your first name"
                    placeholderTextColor="#777777"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                />

                <Text style={styles.label}>LAST NAME *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your last name"
                    placeholderTextColor="#777777"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                />

                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your email (optional)"
                    placeholderTextColor="#777777"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={styles.label}>PHONE NUMBER *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#777777"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <Text style={styles.label}>PASSWORD *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#777777"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Text style={styles.label}>CONFIRM PASSWORD *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#777777"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.registerButton, loading && styles.disabledButton]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#090909" />
                    ) : (
                        <Text style={styles.registerButtonText}>
                            CREATE ACCOUNT
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.loginRow}>
                    <Text style={styles.loginText}>
                        Already have an account?
                    </Text>

                    <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                        <Text style={styles.loginLink}> Sign in</Text>
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
        paddingBottom: 45,
    },
    back: {
        color: "#C6FF00",
        fontWeight: "800",
        fontSize: 14,
    },
    heading: {
        marginTop: 40,
        marginBottom: 25,
    },
    brand: {
        color: "#C6FF00",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 3,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "900",
        marginTop: 18,
    },
    subtitle: {
        color: "#999999",
        fontSize: 14,
        marginTop: 8,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: "#171717",
        borderWidth: 1,
        borderColor: "#333333",
        borderRadius: 10,
        padding: 15,
        color: "#FFFFFF",
        fontSize: 15,
    },
    registerButton: {
        backgroundColor: "#C6FF00",
        padding: 18,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 30,
    },
    disabledButton: {
        opacity: 0.6,
    },
    registerButtonText: {
        color: "#090909",
        fontWeight: "900",
        fontSize: 14,
    },
    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 25,
    },
    loginText: {
        color: "#999999",
    },
    loginLink: {
        color: "#C6FF00",
        fontWeight: "900",
    },
});