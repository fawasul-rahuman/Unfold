import { StyleSheet, Platform, TouchableOpacity, View, Text, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from '../ThemeContext'; // Import your custom theme hook

export default function ModalScreen() {
  const { theme } = useTheme(); // Access the current theme (colors and font settings)

  const clearPreferences = async () => {
    Alert.alert(
      "Reset App",
      "This will clear all your saved themes and history. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.clear();
            router.back();
          } 
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Drag handle for iOS style modal */}
      <View style={[styles.dragHandle, { backgroundColor: theme.secondary }]} />

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>UNFOLD NEWS</Text>
        <Text style={styles.subtitle}>Version 1.0.0</Text>
        
        <View style={[styles.divider, { backgroundColor: theme.secondary }]} />

        {/* Developer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          <Text style={[styles.sectionValue, { color: theme.text }]}>Fawasul Rahuman</Text>
        </View>

        {/* Settings Action */}
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.id === 'midnight' ? '#2C0000' : '#FFF5F5' }]} 
          onPress={clearPreferences}
        >
          <Ionicons name="refresh-outline" size={20} color="#FF3B30" />
          <Text style={[styles.buttonText, { color: '#FF3B30' }]}>Reset App Preferences</Text>
        </TouchableOpacity>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Noe-Display', 
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#888',
    marginTop: 5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 30,
    opacity: 0.5,
  },
  section: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 1.5,
  },
  sectionValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 10,
    fontWeight: '800',
    fontSize: 14,
  },
  closeButton: {
    marginTop: 40,
  },
  closeButtonText: {
    color: '#888',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});