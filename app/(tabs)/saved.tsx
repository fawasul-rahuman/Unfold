import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, SafeAreaView, FlatList, 
  Image, TouchableOpacity, Dimensions, ActivityIndicator, StatusBar, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useTheme } from '../ThemeContext';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

interface SavedArticle {
  title: string;
  source: string;
  image: string;
  date: string;
  link: string;
}

export default function SavedScreen() {
  const router = useRouter();
  const { theme } = useTheme(); 
  const [savedItems, setSavedItems] = useState<SavedArticle[]>([]);
  
  const [fontsLoaded] = useFonts({ "Noe-Display": require("../../assets/fonts/NoeDisplay-Bold.ttf") });

  useFocusEffect(
    React.useCallback(() => {
      const loadSaves = async () => {
        try {
          const data = await AsyncStorage.getItem('saved_articles');
          setSavedItems(data ? JSON.parse(data) : []);
        } catch (e) {
          console.error("Failed to load saved articles", e);
        }
      };
      loadSaves();
    }, [])
  );

  const removeItem = async (link: string) => {
    const filtered = savedItems.filter((i) => i.link !== link);
    setSavedItems(filtered);
    await AsyncStorage.setItem('saved_articles', JSON.stringify(filtered));
  };

  // The "Cool Animation" for the background delete action
  const renderRightActions = (progress: any, dragX: any, link: string) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity 
        style={[styles.deleteAction, { backgroundColor: '#FF5252' }]} 
        onPress={() => removeItem(link)}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={28} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (!fontsLoaded) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={theme.id === 'midnight' ? "light-content" : "dark-content"} />
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Saved</Text>
        </View>

        {savedItems.length > 0 ? (
          <FlatList
            data={savedItems}
            keyExtractor={(item) => item.link}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.link)}
                friction={2}
                rightThreshold={40}
              >
                <TouchableOpacity 
                  activeOpacity={1}
                  style={[styles.articleCard, { backgroundColor: theme.bg, borderBottomColor: theme.id === 'midnight' ? '#333' : '#F0F0F0' }]}
                  onPress={() => router.push({ pathname: "/article", params: { ...item } })}
                >
                  <Image source={{ uri: item.image }} style={styles.thumbnail} />
                  
                  <View style={styles.cardContent}>
                    <Text style={[styles.sourceText, { color: theme.id === 'midnight' ? '#AAA' : '#888' }]}>
                      {item.source}
                    </Text>
                    <Text style={[styles.articleTitle, { color: theme.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.iconCircle, { backgroundColor: theme.id === 'midnight' ? '#222' : '#F8F8F8' }]}>
              <Ionicons name="bookmark-outline" size={32} color={theme.text} style={{ opacity: 0.3 }} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing saved</Text>
            <Text style={styles.emptySubtitle}>Swipe left on items to remove them.</Text>
          </View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 25, paddingTop: 35, paddingBottom: 15 },
  title: { fontSize: 42, fontFamily: 'Noe-Display' },
  articleCard: { 
    flexDirection: 'row', 
    paddingVertical: 20, 
    paddingHorizontal: 25,
    borderBottomWidth: 1, 
    alignItems: 'center' 
  },
  thumbnail: { width: 75, height: 75, borderRadius: 12, backgroundColor: '#F0F0F0' },
  cardContent: { flex: 1, marginLeft: 15, marginRight: 10 },
  sourceText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1.2 },
  articleTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22 },
  dateText: { fontSize: 11, color: '#999', marginTop: 6 },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#888', textAlign: 'center' }
});