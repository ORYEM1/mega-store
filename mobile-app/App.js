import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "./src/navigation/RootNavigator";
import colors from "./src/theme/colors";

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StatusBar
                    style="light"
                    backgroundColor={colors.background}
                />

                <RootNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}