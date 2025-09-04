import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ChatScreen from "../screens/ChatScreen";
import NotesScreen from "../screens/NotesScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CustomDrawerContent from "../components/CustomDrawerContent";
import { colors } from "../theme/colors";

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerStyle: { 
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          drawerStyle: { backgroundColor: colors.background },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.textSecondary,
          drawerType: 'slide',
          overlayColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <Drawer.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Notes" 
          component={NotesScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="document-text-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}