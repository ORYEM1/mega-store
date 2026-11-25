import React from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import ShopScreen from "../screens/ShopScreen";
import CartScreen from "../screens/CartScreen";
import colors from "../theme/colors";
import AccountScreen from "../screens/AccountScreen";
import { useCartStore } from "../store/cartStore";

const Tab = createBottomTabNavigator();

function PlaceholderScreen({ route }) {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: colors.background,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    color: colors.primary,
                    fontSize: 24,
                    fontWeight: "900",
                }}
            >
                {route.name}
            </Text>
        </View>
    );
}

function TabIcon({ symbol, color }) {
    return (
        <Text style={{ color, fontSize: 21, fontWeight: "800" }}>
            {symbol}
        </Text>
    );
}

export default function BottomTabNavigator() {
    const items = useCartStore((state) => state.items);

    const cartCount = items.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0
    );

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    height: 65,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.muted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "700",
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: "Home",
                    tabBarIcon: ({ color }) => (
                        <TabIcon symbol="⌂" color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Shop"
                component={ShopScreen}
                options={{
                    tabBarLabel: "Shop",
                    tabBarIcon: ({ color }) => (
                        <TabIcon symbol="◈" color={color} />
                    ),
                }}
            />

            <Tab.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    tabBarLabel: "Cart",
                    tabBarBadge: cartCount > 0 ? cartCount : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: colors.primary,
                        color: "#090909",
                        fontWeight: "900",
                    },
                    tabBarIcon: ({ color }) => (
                        <TabIcon symbol="🛍" color={color} />
                    ),
                }}
            />

            <Tab.Screen
                   name="Account"
                   component={AccountScreen}
                   options={{
                       tabBarLabel: "Account",
                       tabBarIcon: ({ color }) => (
                           <TabIcon symbol="♙" color={color} />
                       ),
                   }}
            />
        </Tab.Navigator>
    );
}