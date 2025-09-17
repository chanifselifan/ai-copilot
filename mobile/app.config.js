export default {
  expo: {
    name: "ai-copilot-mobile",
    slug: "ai-copilot-mobile", 
    version: "1.0.0",
    platforms: ["ios", "android"],
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0F0F0F"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.anonymous.mobile",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F0F0F"
      }
    },
    plugins: [
      "expo-dev-client",
      "expo-sqlite"
    ]
  }
};