import { Tabs, usePathname, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../ThemeContext'; 

export default function TabLayout() {
  const pathname = usePathname();
  const { theme } = useTheme();

  // Inside app/(tabs)/_layout.tsx

  const [fontsLoaded] = useFonts({
    "Noe-Display": require("../../assets/fonts/NoeDisplay-Bold.ttf"),
    "Noe-Medium": require("../../assets/fonts/Noe-Display-Medium.ttf"), // Added this
    "Noe-Text": require("../../assets/fonts/Noe-Text-Regular.ttf"),    // Added this
  });

  const isActive = (route: string) => {
    if (route === 'index') return pathname === '/';
    return pathname.includes(route);
  };

  const handleSearchHold = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: '/search', params: { autoFocus: 'true' } });
  };

  const handleGeneralHold = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  if (!fontsLoaded) return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.bg }}>
      <ActivityIndicator color={theme.text} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          height: 65,
          backgroundColor: theme.bg,
          borderTopWidth: 1,
          borderTopColor: theme.secondary,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      
      {/* 1. HOME */}
      <Tabs.Screen name="index" options={{
          tabBarButton: (props) => (
            <TouchableOpacity 
              onPress={props.onPress ?? undefined}
              onLongPress={handleGeneralHold}
              delayLongPress={500}
              style={styles.tab}
            >
              <Ionicons name={isActive('index') ? "newspaper" : "newspaper-outline"} size={24} color={isActive('index') ? theme.text : "#AAA"} />
            </TouchableOpacity>
          ),
      }} />

      {/* 2. VIDEO (NEWLY ALIGNED) */}
      <Tabs.Screen name="infinite" options={{
          tabBarButton: (props) => (
            <TouchableOpacity 
              onPress={props.onPress ?? undefined}
              onLongPress={handleGeneralHold}
              delayLongPress={500}
              style={styles.tab}
            >
              <Ionicons 
                name={isActive('infinite') ? "infinite" : "infinite-outline"} 
                size={24} 
                color={isActive('infinite') ? theme.text : "#AAA"} 
              />
            </TouchableOpacity>
          ),
      }} />

      {/* 4. SEARCH */}
      <Tabs.Screen name="search" options={{
          tabBarButton: (props) => (
            <TouchableOpacity 
              onPress={props.onPress ?? undefined}
              onLongPress={handleSearchHold} 
              delayLongPress={500}
              style={styles.tab}
            >
              <Ionicons name={isActive('search') ? "search" : "search-outline"} size={24} color={isActive('search') ? theme.text : "#AAA"} />
            </TouchableOpacity>
          ),
      }} />

      {/* 3. SAVED */}
      <Tabs.Screen name="saved" options={{
          tabBarButton: (props) => (
            <TouchableOpacity 
              onPress={props.onPress ?? undefined}
              onLongPress={handleGeneralHold}
              delayLongPress={500}
              style={styles.tab}
            >
              <Ionicons name={isActive('saved') ? "bookmark" : "bookmark-outline"} size={24} color={isActive('saved') ? theme.text : "#AAA"} />
            </TouchableOpacity>
          ),
      }} />

      {/* 5. LAB */}
      <Tabs.Screen name="lab" options={{
          tabBarButton: (props) => (
            <TouchableOpacity 
              onPress={props.onPress ?? undefined}
              onLongPress={handleGeneralHold}
              delayLongPress={500}
              style={styles.tab}
            >
              <Ionicons name={isActive('lab') ? "flask" : "flask-outline"} size={24} color={isActive('lab') ? theme.text : "#AAA"} />
            </TouchableOpacity>
          ),
      }} />

      {/* HIDDEN SCREENS */}
      <Tabs.Screen name="modal" options={{ href: null }} /> 
      <Tabs.Screen name="profile" options={{ href: null }} />
      {/* Note: Based on your screenshot, article.tsx is in /app, not /app/(tabs). 
          If it's in the app root, you don't need it in the Tabs navigator. */}
      <Tabs.Screen name="article" options={{ href: null }} />
      
    </Tabs>
  );
}

const styles = StyleSheet.create({ 
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' } 
});