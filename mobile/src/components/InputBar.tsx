import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type Props = {
  onSendMessage: (text: string) => void;
};

export default function InputBar({ onSendMessage }: Props) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleSend = () => {
    if (value.trim()) {
      // Send button animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onSendMessage(value.trim());
      setValue("");
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <Animated.View style={[styles.container, { borderColor }]}>
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="attach" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={setValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={[
              styles.sendButton,
              { 
                backgroundColor: value.trim() ? colors.primary : colors.border,
                opacity: value.trim() ? 1 : 0.6
              }
            ]}
            onPress={handleSend}
            disabled={!value.trim()}
          >
            <Ionicons 
              name="send" 
              size={18} 
              color={value.trim() ? colors.text : colors.textMuted} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {value.length > 800 && (
        <View style={styles.charCount}>
          <Text style={styles.charCountText}>
            {value.length}/1000
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surfaceVariant,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 48,
  },
  attachButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
  },
  charCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  charCountText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});