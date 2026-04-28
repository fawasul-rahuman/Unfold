import React, { useState, useEffect, useRef, memo } from 'react';
import { 
  View, StyleSheet, Text, StatusBar, Dimensions, Animated, 
  ActivityIndicator, Platform, Share, TouchableOpacity,
  ScrollView, Image, Linking 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useTheme } from '../ThemeContext'; 
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const NEWSDATA_API_KEY = 'pub_410925b4ae9a4a88b511ed942a313555'; 
const SAFE_TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 30); 

const PASTEL_PALETTE = [
  { bg: '#E3F2FD', text: '#0D47A1' }, { bg: '#F3E5F5', text: '#4A148C' }, 
  { bg: '#E8F5E9', text: '#1B5E20' }, { bg: '#FFFDE7', text: '#F57F17' },
  { bg: '#FFE0B2', text: '#E65100' }, { bg: '#FCE4EC', text: '#880E4F' },
];

const NewsCard = memo(({ item, index, scrollX }: any) => {
  const [bookmarked, setBookmarked] = useState(false);
  const colorScheme = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  
  const rotate = scrollX.interpolate({
    inputRange,
    outputRange: ['-5deg', '0deg', '5deg'],
    extrapolate: 'clamp',
  });

  const sourceName = item?.source_id?.toUpperCase() || "NEWS";

  useEffect(() => {
    const checkStatus = async () => {
      const data = await AsyncStorage.getItem('saved_articles');
      if (data) {
        const list = JSON.parse(data);
        setBookmarked(list.some((i: any) => i.link === item.link));
      }
    };
    checkStatus();
  }, [item.link]);

  const toggleBookmark = async () => {
    try {
      const data = await AsyncStorage.getItem('saved_articles');
      let list = data ? JSON.parse(data) : [];

      if (bookmarked) {
        list = list.filter((i: any) => i.link !== item.link);
      } else {
        list.push({
          title: item.title,
          source: sourceName,
          image: item.image_url || "https://via.placeholder.com/150",
          date: new Date().toLocaleDateString(),
          link: item.link
        });
      }
      await AsyncStorage.setItem('saved_articles', JSON.stringify(list));
      setBookmarked(!bookmarked);
    } catch (e) { console.error(e); }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${item.title}\n\nRead more: ${item.link}` });
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.cardContainer}>
      <Animated.View style={[styles.card, { backgroundColor: colorScheme.bg, transform: [{ perspective: 1000 }, { rotate }] }]}>
        {/* Background image is now properly clipped by the card's overflow:hidden */}
        <Image source={require('../../assets/images/overlay.png')} style={styles.cardOverlay} resizeMode="cover" />
        
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colorScheme.text }]}>
            <Text style={[styles.badgeText, { color: colorScheme.bg }]}>UNFOLD INFINITE</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={toggleBookmark} style={{ marginRight: 15 }}>
              <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={colorScheme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color={colorScheme.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.titleScroll} centerContent={true}>
           <Text style={[styles.hugeTitle, { color: colorScheme.text }]}>{item?.title}</Text>
        </ScrollView>

        <View style={styles.cardFooter}>
          <View style={styles.publisherRow}>
            <View style={[styles.avatar, { backgroundColor: colorScheme.text }]}>
              <Text style={{ color: colorScheme.bg, fontWeight: '900', fontSize: 10 }}>{sourceName.charAt(0)}</Text>
            </View>
            <Text style={[styles.channelName, { color: colorScheme.text }]} numberOfLines={1}>{sourceName}</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL(item.link)}>
            <Ionicons name="arrow-forward-circle" size={38} color={colorScheme.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

export default function InfiniteScreen() {
  const { theme } = useTheme();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const currentIndex = useRef(0);

  const [fontsLoaded] = useFonts({ "Noe-Display": require("../../assets/fonts/NoeDisplay-Bold.ttf") });

  useEffect(() => { fetchNews(); }, []);

  useEffect(() => {
    if (loading || articles.length === 0) return;
    const interval = setInterval(() => {
      currentIndex.current += 1;
      flatListRef.current?.scrollToOffset({ offset: currentIndex.current * width, animated: true });
    }, 5000); 
    return () => clearInterval(interval);
  }, [loading, articles]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://newsdata.io/api/1/latest?apikey=${NEWSDATA_API_KEY}&language=en`);
      const data = await res.json();
      if (data.results) setArticles(data.results);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.id === 'midnight' ? "light-content" : "dark-content"} />
      <View style={styles.topTitleBar}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Infinite</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.text} /></View>
      ) : (
        <>
          <Animated.FlatList
            ref={flatListRef}
            data={Array.from({ length: 10000 })}
            horizontal
            pagingEnabled
            disableIntervalMomentum
            snapToInterval={width}
            decelerationRate={0.9}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false} // Removed horizontal scrollbar
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            renderItem={({ index }) => <NewsCard item={articles[index % articles.length]} index={index} scrollX={scrollX} />}
          />
          <View style={styles.hintWrapper}>
            <Ionicons name="chevron-back" size={14} color={theme.text} style={{ opacity: 0.2 }} />
            <Text style={[styles.hintText, { color: theme.text }]}>SWIPE TO EXPLORE</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.text} style={{ opacity: 0.2 }} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topTitleBar: { paddingTop: 35, paddingHorizontal: 25, paddingBottom: 10 },
  screenTitle: { fontSize: 40, fontWeight: '900', fontFamily: Platform.OS === 'ios' ? 'Noe Display' : 'serif' },
  cardContainer: { width, height: height * 0.78, justifyContent: 'center', alignItems: 'center' },
  card: { 
    width: width * 0.85, 
    height: height * 0.70, 
    borderRadius: 40, 
    padding: 30, 
    justifyContent: 'space-between',
    overflow: 'hidden' // This clips the bg image overlay
  },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, width: '200%', height: '60%', opacity: 0.1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  badgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  titleScroll: { marginVertical: 20 },
  hugeTitle: { fontSize: 30, fontWeight: '800', lineHeight: 36, fontFamily: Platform.OS === 'ios' ? 'Noe Display' : 'serif' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)', paddingTop: 20 },
  publisherRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  channelName: { fontSize: 12, fontWeight: '800' },
  hintWrapper: { position: 'absolute', bottom: 25, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' },
  hintText: { fontSize: 9, fontWeight: '900', letterSpacing: 3, marginHorizontal: 15, opacity: 0.2 }
});