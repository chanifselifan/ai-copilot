import React, { useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { Message } from "../types";

type Props = {
  message: Message;
  isLast?: boolean;
  animationDelay?: number;
};

export default function ChatBubble({ message, isLast, animationDelay = 0 }: Props) {
  const isUser = message.sender === "user";
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const copyToClipboard = () => {
    // In a real app, you'd use Clipboard from @react-native-clipboard/clipboard
    Alert.alert("Disalin", "Pesan telah disalin ke clipboard");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          alignSelf: isUser ? "flex-end" : "flex-start",
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={copyToClipboard}
        activeOpacity={0.8}
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderBottomRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: isUser ? 16 : 4,
          },
        ]}
      >
        <Text style={[styles.text, { color: isUser ? colors.text : colors.text }]}>
          {message.text}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
            {formatTime(message.timestamp)}
          </Text>
          {isUser && (
            <Ionicons 
              name="checkmark-done" 
              size={14} 
              color="rgba(255,255,255,0.7)" 
              style={styles.checkmark} 
            />
          )}
        </View>
      </TouchableOpacity>
      
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={12} color={colors.text} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    maxWidth: "85%",
  },
  bubble: {
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 60,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  checkmark: {
    marginLeft: 4,
  },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
