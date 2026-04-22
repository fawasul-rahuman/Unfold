import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Animated,
	FlatList,
	Image,
	Platform,
	RefreshControl,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";

const CATEGORY_MAP: Record<string, string> = {
    general: "top",
    world: "world",
    technology: "technology",
    business: "business",
    sports: "sports",
    science: "science",
    health: "health",
    entertainment: "entertainment",
    politics: "politics",
};

const SAFE_TOP = Platform.OS === 'ios' ? 50 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40; 
const LOGO_AREA_HEIGHT = 80; 
const TOTAL_HEADER_HEIGHT = SAFE_TOP + LOGO_AREA_HEIGHT;

// --- SKELETON COMPONENT ---
const SkeletonCard = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.card}>
            <View style={styles.publisherRow}>
                <Animated.View style={[styles.skeletonCircle, { opacity }]} />
                <Animated.View style={[styles.skeletonBar, { width: 80, height: 12, opacity }]} />
            </View>
            <Animated.View style={[styles.skeletonImage, { opacity }]} />
            <View style={styles.cardInfo}>
                <Animated.View style={[styles.skeletonBar, { width: 60, height: 10, marginBottom: 10, opacity }]} />
                <Animated.View style={[styles.skeletonBar, { width: '90%', height: 20, marginBottom: 8, opacity }]} />
                <Animated.View style={[styles.skeletonBar, { width: '60%', height: 20, opacity }]} />
            </View>
        </View>
    );
};

export default function App() {
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null); // Added Ref for scrolling
    
    const [fontsLoaded] = useFonts({
        "Noe-Display": require("../assets/fonts/NoeDisplay-Bold.ttf"),
    });

    const [selectedCategory, setSelectedCategory] = useState("general");
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, LOGO_AREA_HEIGHT],
        outputRange: [0, -LOGO_AREA_HEIGHT],
        extrapolate: 'clamp',
    });

    const logoOpacity = scrollY.interpolate({
        inputRange: [0, LOGO_AREA_HEIGHT / 2],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    const fetchNews = async (isSwitching = false) => {
        if (isSwitching) {
            setLoading(true);
            setNextPage(null);
        }
        
        try {
            const apiCategory = CATEGORY_MAP[selectedCategory] || "general";
            let clean: any[] = [];
    
            // --- 1. PRIMARY: MediaStack ---
            try {
                const offset = news.length;
                const mediaStackUrl = `http://api.mediastack.com/v1/news?access_key=8bc9d71e21aaed81a0767ef225b87c0f&categories=${apiCategory}&languages=en&offset=${isSwitching ? 0 : offset}`;
                
                const res = await fetch(mediaStackUrl);
                const data = await res.json();
                
                if (data?.data && data.data.length > 0) {
                    clean = data.data.map((item: any) => ({
                        id: item.url + Math.random(),
                        title: item.title,
                        description: item.description || "Read the full story below.",
                        image: item.image,
                        source: item.source?.toUpperCase() || "NEWS",
                        sourceLogo: `https://logo.clearbit.com/${item.source?.toLowerCase().replace(/\s/g, '')}.com`,
                        url: item.url,
                        date: item.published_at,
                    }));
                }
            } catch (err) { console.log("MediaStack Failed"); }
    
            // --- 2. SECONDARY: World News API ---
            if (clean.length === 0) {
                try {
                    const worldNewsUrl = `https://api.worldnewsapi.com/search-news?api-key=e3ad74ac07d84bc4b5f18bfb8ba83070&text=${apiCategory}`;
                    const res = await fetch(worldNewsUrl);
                    const data = await res.json();
                    if (data?.news) {
                        clean = data.news.map((item: any) => ({
                            id: item.id?.toString(),
                            title: item.title,
                            description: item.text,
                            image: item.image,
                            source: item.author || item.source || "WORLD NEWS",
                            sourceLogo: `https://logo.clearbit.com/${item.source}.com`,
                            url: item.url,
                            date: item.publish_date,
                        }));
                    }
                } catch (err) { console.log("World News Failed"); }
            }
    
            // --- 3. TERTIARY: NewsData.io ---
            if (clean.length === 0) {
                try {
                    let newsDataUrl = `https://newsdata.io/api/1/latest?apikey=pub_410925b4ae9a4a88b511ed942a313555&category=${apiCategory}&language=en`;
                    if (!isSwitching && nextPage) newsDataUrl += `&page=${nextPage}`;
                    const res = await fetch(newsDataUrl);
                    const data = await res.json();
                    if (data?.results) {
                        setNextPage(data.nextPage || null);
                        clean = data.results.map((item: any) => ({
                            id: item.article_id,
                            title: item.title,
                            description: item.description?.includes("paid plan") ? "Full story available at source." : item.description,
                            image: item.image_url,
                            source: item.source_id.toUpperCase(),
                            sourceLogo: item.source_icon,
                            url: item.link,
                            date: item.pubDate,
                        }));
                    }
                } catch (err) { console.log("All APIs failed."); }
            }
    
            setNews(prev => isSwitching ? clean : [...prev, ...clean]);
            if (isSwitching && clean.length > 0) {
                await AsyncStorage.setItem("cached_feed", JSON.stringify(clean));
            }
        } catch (err) {
            const cached = await AsyncStorage.getItem("cached_feed");
            if (cached && isSwitching) setNews(JSON.parse(cached));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => { fetchNews(true); }, [selectedCategory]);

    const loadMore = () => {
        if (!isFetchingMore && nextPage) {
            setIsFetchingMore(true);
            fetchNews(false);
        }
    };

    if (!fontsLoaded) return null;

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.cardContainer}>
            <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.card}
                onPress={() => router.push({ pathname: "/article", params: item })}
            >
                <View style={styles.publisherRow}>
                    <Image source={{ uri: item.sourceLogo || 'https://via.placeholder.com/40' }} style={styles.publisherLogo} />
                    <Text style={styles.publisherName}>{item.source}</Text>
                    <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" style={{marginLeft: 4}} />
                </View>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.image || 'https://via.placeholder.com/400' }} style={styles.cardImage} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardDate}>{item.date || "Just now"}</Text>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                </View>
            </TouchableOpacity>
            <View style={styles.feedSeparator} />
        </View>
    );

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.headerWrapper, { transform: [{ translateY: headerTranslateY }] }]}>
                <Animated.View style={[styles.logoArea, { opacity: logoOpacity }]}>
                    <Image source={require("../assets/images/logo.png")} style={styles.brandLogo} resizeMode="contain" />
                </Animated.View>
                <View style={styles.pillContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {Object.keys(CATEGORY_MAP).map((cat) => (
                            <TouchableOpacity 
                                key={cat} 
                                onPress={() => {
                                    // Scroll to top immediately when category is clicked
                                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                                    setSelectedCategory(cat);
                                }} 
                                style={[styles.pill, selectedCategory === cat && styles.activePill]}
                            >
                                <Text style={[styles.pillText, selectedCategory === cat && styles.activePillText]}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View style={styles.categorySeparator} />
                </View>
            </Animated.View>

            {loading ? (
                <View style={{ paddingTop: TOTAL_HEADER_HEIGHT + 70 }}>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </View>
            ) : (
                <Animated.FlatList
                    ref={flatListRef} // Attached Ref
                    data={news}
                    keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
                    renderItem={renderItem}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isFetchingMore ? <ActivityIndicator color="#000" style={{ marginVertical: 20 }} /> : null}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNews(true)} />}
                    contentContainerStyle={{ paddingTop: TOTAL_HEADER_HEIGHT + 70, paddingBottom: 10 }} // Tightened bottom spacing
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF" },
    headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#FFF', paddingTop: SAFE_TOP },
    logoArea: { height: LOGO_AREA_HEIGHT, alignItems: 'center', justifyContent: 'center' },
    brandLogo: { width: 120, height: 40 },
    pillContainer: { backgroundColor: '#FFF', paddingBottom: 10 },
    pill: { backgroundColor: '#F6F6F6', paddingHorizontal: 20, borderRadius: 14, marginRight: 8, justifyContent: 'center', height: 40 },
    activePill: { backgroundColor: '#000' },
    pillText: { fontSize: 13, color: '#777', fontWeight: '700' },
    activePillText: { color: '#FFF' },
    categorySeparator: { height: 1, backgroundColor: '#F0F0F0', width: '100%', marginTop: 10 },
    cardContainer: { width: '100%' },
    card: { paddingHorizontal: 20, paddingVertical: 15 },
    publisherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    publisherLogo: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEE', marginRight: 8 },
    publisherName: { fontSize: 13, fontWeight: '800', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 },
    imageWrapper: { width: '100%', height: 230, borderRadius: 24, overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%' },
    cardInfo: { marginTop: 14 },
    cardDate: { fontSize: 11, color: '#AAA', fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
    cardTitle: { fontSize: 22, fontFamily: "Noe-Display", lineHeight: 28, color: '#000' },
    feedSeparator: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20, marginTop: 15 },
    skeletonCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E1E9EE', marginRight: 8 },
    skeletonBar: { backgroundColor: '#E1E9EE', borderRadius: 4 },
    skeletonImage: { width: '100%', height: 230, borderRadius: 24, backgroundColor: '#E1E9EE' }
});