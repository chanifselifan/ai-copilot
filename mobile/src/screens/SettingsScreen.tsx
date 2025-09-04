import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showToggle = false, 
    toggleValue = false, 
    onToggle 
  }: any) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          thumbColor={colors.text}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.ScrollView style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferensi</Text>
        
        <SettingItem
          icon="moon-outline"
          title="Mode Gelap"
          subtitle="Aktifkan tema gelap untuk pengalaman yang lebih nyaman"
          showToggle
          toggleValue={darkMode}
          onToggle={setDarkMode}
        />
        
        <SettingItem
          icon="notifications-outline"
          title="Notifikasi"
          subtitle="Terima pemberitahuan untuk pesan baru"
          showToggle
          toggleValue={notifications}
          onToggle={setNotifications}
        />
        
        <SettingItem
          icon="save-outline"
          title="Simpan Otomatis"
          subtitle="Simpan percakapan secara otomatis"
          showToggle
          toggleValue={autoSave}
          onToggle={setAutoSave}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Akun</Text>
        
        <SettingItem
          icon="person-outline"
          title="Profil"
          subtitle="Kelola informasi profil Anda"
          onPress={() => {}}
        />
        
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privasi & Keamanan"
          subtitle="Pengaturan privasi dan keamanan akun"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bantuan</Text>
        
        <SettingItem
          icon="help-circle-outline"
          title="Pusat Bantuan"
          subtitle="FAQ dan panduan penggunaan"
          onPress={() => {}}
        />
        
        <SettingItem
          icon="chatbubble-outline"
          title="Hubungi Kami"
          subtitle="Kirim feedback atau laporkan masalah"
          onPress={() => {}}
        />
        
        <SettingItem
          icon="information-circle-outline"
          title="Tentang Aplikasi"
          subtitle="Versi 1.0.0"
          onPress={() => {}}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>AI Copilot v1.0.0</Text>
        <Text style={styles.footerSubtext}>Dibuat dengan ❤️ untuk pengalaman terbaik</Text>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
