import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Animated
} from "react-native";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import TypingIndicator from "../components/TypingIndicator";
import { colors } from "../theme/colors";
import { Message } from "../types";

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
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(text),
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);

    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      "Itu pertanyaan yang menarik! Mari saya bantu Anda dengan informasi yang tepat.",
      "Saya memahami kebutuhan Anda. Berikut adalah solusi yang bisa membantu:",
      "Terima kasih telah bertanya. Berdasarkan analisis saya, berikut rekomendasinya:",
      "Pertanyaan yang bagus! Saya akan memberikan jawaban yang komprehensif untuk Anda.",
      "Saya senang bisa membantu! Mari kita bahas hal ini secara detail.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <ChatBubble 
      message={item} 
      isLast={index === messages.length - 1}
      animationDelay={index * 100}
    />
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
  messagesList: {
    padding: 16,
    paddingBottom: 20,
  },
});