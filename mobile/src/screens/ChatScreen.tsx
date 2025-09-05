import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Alert,
  TouchableOpacity,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import TypingIndicator from "../components/TypingIndicator";
import { colors } from "../theme/colors";
import { Message } from "../types";
import aiService from "../services/aiServise";

const initialMessages: Message[] = [
  { 
    id: "1", 
    text: "Halo! Saya AI Copilot siap membantu Anda 🚀\n\nAda yang bisa saya bantu hari ini?", 
    sender: "ai",
    timestamp: new Date(Date.now() - 5000)
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setConnectionError(false);

    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get recent messages for context
      const recentMessages = messages.slice(-3).map(msg => 
        `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`
      ).join('\n');
      
      const context = `Previous conversation:\n${recentMessages}`;
      
      const response = await aiService.chatWithAI(text, context);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('AI Chat error:', error);
      setConnectionError(true);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Maaf, saya mengalami kesulitan dalam merespons. Silakan coba lagi atau periksa koneksi internet Anda.",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      Alert.alert('Connection Error', error.message);
    } finally {
      setIsTyping(false);
      // Auto scroll after AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const retryConnection = () => {
    setConnectionError(false);
    // You could implement a connection test here
    Alert.alert('Info', 'Connection status reset. Try sending a message.');
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages(initialMessages);
            setConnectionError(false);
          },
        },
      ]
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <ChatBubble 
      message={item} 
      isLast={index === messages.length - 1}
      animationDelay={index * 50}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {connectionError && (
        <TouchableOpacity 
          style={styles.errorBanner}
          onPress={retryConnection}
        >
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={styles.errorText}>Connection issue - Tap to retry</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.chatInfo}>
        <View style={styles.aiStatus}>
          <View style={[styles.statusDot, { backgroundColor: connectionError ? colors.error : colors.success }]} />
          <Text style={styles.statusText}>
            AI Copilot {connectionError ? 'Offline' : 'Online'}
          </Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Ionicons name="refresh" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
        {renderHeader()}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
        {isTyping && <TypingIndicator />}
      </Animated.View>
      <InputBar onSendMessage={handleSendMessage} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: colors.warning,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  chatInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    padding: 8,
    borderRadius: 6,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
});