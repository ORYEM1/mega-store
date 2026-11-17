import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomTabNavigator from "./BottomTabNavigator";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import PaymentPendingScreen from "../screens/PaymentPendingScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OrderDetailsScreen from "../screens/OrderDetailsScreen";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: "#090909",
                },
            }}
        >
            <Stack.Screen
                name="MainTabs"
                component={BottomTabNavigator}
            />

            <Stack.Screen
                name="ProductDetails"
                component={ProductDetailsScreen}
            />

            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />

            <Stack.Screen
                name="Register"
                component={RegisterScreen}
            />

            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
            />

            <Stack.Screen
                 name="PaymentPending"
                 component={PaymentPendingScreen}
                 
            /> 

            <Stack.Screen
                name="Orders"
                component={OrdersScreen}
            />  

            <Stack.Screen
                name="OrderDetails"
                component={OrderDetailsScreen}
            />           
        </Stack.Navigator>
    );
}