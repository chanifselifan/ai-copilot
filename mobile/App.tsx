import React from "react";
import { StatusBar } from "expo-status-bar";
import { Provider as PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { theme } from "../mobile/src/theme/theme";
import AppNavigator from "../mobile/src/navigation/AppNavigator";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <StatusBar style="light" backgroundColor={theme.colors.background} />
        <AppNavigator />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}