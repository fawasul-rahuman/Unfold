import { Ionicons } from '@expo/vector-icons';
import { useFonts } from "expo-font";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    PanResponder,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

// 1. IMPORT THE THEME HOOK
import { useTheme } from '../ThemeContext'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CATEGORY_MAP: Record<string, string> = {
    General: "top",
    World: "world",
    Technology: "technology",
    Business: "business",
    Sports: "sports",
    Science: "science",
    Health: "health",
    Entertainment: "entertainment",
    Politics: "politics",
};

const LANGUAGE_MAP: Record<string, string> = {
    English: "en",
    Hindi: "hi",
    Malayalam: "ml",
    Tamil: "ta",
    Arabic: "ar",
    French: "fr",
};

const SAFE_TOP = Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 30); 
const LOGO_AREA_HEIGHT = 60; 
const TOTAL_HEADER_HEIGHT = SAFE_TOP + LOGO_AREA_HEIGHT + 60; 

const SkeletonCard = () => (
    <View style={styles.card}>
        <View style={styles.publisherRow}>
            <View style={[styles.skeleton, { width: 24, height: 24, borderRadius: 12 }]} />
            <View style={[styles.skeleton, { width: 100, height: 12, marginLeft: 8, borderRadius: 4 }]} />
        </View>
        <View style={[styles.skeleton, styles.imageWrapper]} />
        <View style={styles.cardInfo}>
            <View style={[styles.skeleton, { width: 60, height: 10, marginBottom: 8, borderRadius: 4 }]} />
            <View style={[styles.skeleton, { width: '90%', height: 20, borderRadius: 4, marginBottom: 6 }]} />
            <View style={[styles.skeleton, { width: '60%', height: 20, borderRadius: 4 }]} />
        </View>
    </View>
);

export default function App() {
    // 2. INITIALIZE THEME & FONT SIZE
    const { theme, fontSize } = useTheme();
    
    const scrollY = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    
    const [fontsLoaded] = useFonts({
        "Noe-Display": require("../../assets/fonts/NoeDisplay-Bold.ttf"),
    });

    const [selectedCategory, setSelectedCategory] = useState("General");
    const [selectedLanguage, setSelectedLanguage] = useState("English");
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    
    const [news, setNews] = useState<any[]>([]);
    const [buffer, setBuffer] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // Dynamic sizing logic for titles based on Lab
    const titleSize = fontSize === 'Compact' ? 18 : fontSize === 'Large' ? 26 : 22;

    const openFilter = () => {
        setIsFilterVisible(true);
        Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }).start();
    };

    const closeFilter = () => {
        Animated.timing(sheetTranslateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => setIsFilterVisible(false));
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => gestureState.dy > 0 && sheetTranslateY.setValue(gestureState.dy),
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 120 || gestureState.vy > 0.5) closeFilter();
                else Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true }).start();
            }
        })
    ).current;

    const fetchNews = async (isSwitching = false) => {
        if (isSwitching) {
            setLoading(true);
            setError(false);
            setNextPage(null);
            setBuffer([]); 
        }

        try {
            const langCode = LANGUAGE_MAP[selectedLanguage] || "en";
            const currentCategory = selectedCategory === "General" ? "" : selectedCategory.toLowerCase(); 
            const newsDataCategory = CATEGORY_MAP[selectedCategory] || "top";

            let rawResults: any[] = [];

            try {
                const currentsUrl = `https://api.currentsapi.services/v1/latest-news?apiKey=KS6yMcbot04xJerKFpXz7YuP0N5Mxx6dOdJxzpeF3ijyAuKN&language=${langCode}${currentCategory ? `&category=${currentCategory}` : ''}`;
                const res = await fetch(currentsUrl);
                const data = await res.json();

                if (data?.news && data.news.length > 0) {
                    // Inside fetchNews for Currents API
                    rawResults = data.news.map((item: any) => {
                        const domain = item.url.split('/')[2] || '';
                        return {
                            id: item.id || Math.random().toString(),
                            title: item.title,
                            description: item.description, // <-- ADD THIS LINE
                            image: item.image !== 'None' ? item.image : null,
                            source: item.author?.toUpperCase() || "NEWS",
                            sourceLogo: `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
                            url: item.url,
                            date: item.published,
                        };
                    });
                }
            } catch (err) { console.log("Currents failed"); }

            if (rawResults.length === 0) {
                try {
                    let newsDataUrl = `https://newsdata.io/api/1/latest?apikey=pub_410925b4ae9a4a88b511ed942a313555&category=${newsDataCategory}&language=${langCode}`;
                    if (!isSwitching && nextPage) newsDataUrl += `&page=${nextPage}`;
                    const res = await fetch(newsDataUrl);
                    const data = await res.json();
                    if (data?.results) {
                        setNextPage(data.nextPage || null);
                        // Inside fetchNews for NewsData API
                        rawResults = data.results.map((item: any) => ({
                            id: item.article_id,
                            title: item.title,
                            description: item.description, // <-- ADD THIS LINE
                            image: item.image_url,
                            source: item.source_id?.toUpperCase() || "UNFOLD",
                            sourceLogo: item.source_icon || `https://www.google.com/s2/favicons?sz=128&domain=${item.link.split('/')[2]}`,
                            url: item.link,
                            date: item.pubDate,
                        }));
                    }
                } catch (err) { console.log("NewsData failed"); }
            }

            if (rawResults.length > 0) {
                const firstFive = rawResults.slice(0, 5);
                const theRest = rawResults.slice(5);
                setNews(prev => isSwitching ? firstFive : [...prev, ...firstFive]);
                setBuffer(theRest);
                setError(false);
            } else if (isSwitching) {
                setError(true);
            }
        } catch (globalErr) {
            setError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setIsFetchingMore(false);
        }
    };

    const loadMore = () => {
        if (isFetchingMore) return;
        if (buffer.length > 0) {
            setIsFetchingMore(true);
            setTimeout(() => {
                const nextFive = buffer.slice(0, 5);
                const remainingBuffer = buffer.slice(5);
                setNews(prev => [...prev, ...nextFive]);
                setBuffer(remainingBuffer);
                setIsFetchingMore(false);
            }, 600);
        } else if (nextPage) {
            fetchNews(false);
        }
    };

    useEffect(() => { fetchNews(true); }, [selectedCategory, selectedLanguage]);

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.id === 'midnight' ? "light-content" : "dark-content"} />

            {/* Filter Modal */}
            <Modal visible={isFilterVisible} transparent animationType="none">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={closeFilter} />
                    <Animated.View {...panResponder.panHandlers} style={[styles.filterSheet, { backgroundColor: theme.bg, transform: [{ translateY: sheetTranslateY }] }]}>
                        <View style={styles.sheetHeader}>
                            <View style={styles.sheetHandle} />
                            <View style={styles.headerRow}>
                                <Text style={[styles.filterTitle, { color: theme.text }]}>Refine Feed</Text>
                                <TouchableOpacity onPress={() => setSelectedLanguage("English")}>
                                    <Text style={styles.resetText}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <Text style={styles.sectionLabel}>Language</Text>
                        <View style={styles.optionGrid}>
                            {Object.keys(LANGUAGE_MAP).map((lang) => (
                                <TouchableOpacity key={lang} style={[styles.optionBtn, { backgroundColor: theme.secondary }, selectedLanguage === lang && { backgroundColor: theme.text }]} onPress={() => setSelectedLanguage(lang)}>
                                    <Text style={[styles.optionText, { color: theme.text }, selectedLanguage === lang && { color: theme.bg }]}>{lang}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.text }]} onPress={closeFilter}>
                            <Text style={[styles.applyText, { color: theme.bg }]}>Apply Filters</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>

            {/* Header synced with Lab */}
            <Animated.View style={[styles.headerWrapper, { backgroundColor: theme.bg, transform: [{ translateY: scrollY.interpolate({ inputRange: [0, LOGO_AREA_HEIGHT], outputRange: [0, -LOGO_AREA_HEIGHT], extrapolate: 'clamp' }) }] }]}>
                <Animated.View style={[styles.logoArea, { opacity: scrollY.interpolate({ inputRange: [0, LOGO_AREA_HEIGHT / 2], outputRange: [1, 0], extrapolate: 'clamp' }) }]}>
                    <Image source={require("../../assets/images/logo.png")} style={[styles.brandLogo, theme.id === 'midnight' && { tintColor: '#FFF' }]} resizeMode="contain" />
                </Animated.View>
                <View style={styles.categoryRow}>
                    <TouchableOpacity style={[styles.filterIconBtn, { backgroundColor: theme.secondary }]} onPress={openFilter}>
                        <Ionicons name="options-outline" size={22} color={theme.text} />
                        {(selectedLanguage !== "English") && <View style={styles.filterDot} />}
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {Object.keys(CATEGORY_MAP).map((cat) => (
                            <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)} style={[styles.pill, { backgroundColor: theme.secondary }, selectedCategory === cat && { backgroundColor: theme.text }]}>
                                <Text style={[styles.pillText, selectedCategory === cat && { color: theme.bg }]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                <View style={[styles.categorySeparator, { backgroundColor: theme.secondary }]} />
            </Animated.View>

            {loading ? (
                <View style={{ paddingTop: TOTAL_HEADER_HEIGHT }}>
                    {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color={theme.secondary} />
                    <Text style={[styles.errorTitle, { color: theme.text }]}>The feed is empty</Text>
                    <Text style={styles.errorSubtitle}>Check your connection or try a different filter.</Text>
                    <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.text }]} onPress={() => fetchNews(true)}>
                        <Text style={[styles.retryText, { color: theme.bg }]}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Animated.FlatList
                    ref={flatListRef}
                    data={news}
                    keyExtractor={(item, index) => item.id + index}
                    renderItem={({ item }) => (
                        <View style={styles.cardContainer}>
                            <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => router.push({ pathname: "/article", params: item })}>
                                <View style={styles.publisherRow}>
                                    <Image source={{ uri: item.sourceLogo || 'https://via.placeholder.com/40' }} style={styles.publisherLogo} />
                                    <Text style={[styles.publisherName, { color: theme.text }]}>{item.source}</Text>
                                </View>
                                <View style={styles.imageWrapper}>
                                    <Image source={{ uri: item.image || 'https://via.placeholder.com/400' }} style={styles.cardImage} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardDate}>{item.date}</Text>
                                    <Text style={[styles.cardTitle, { color: theme.text, fontSize: titleSize }]} numberOfLines={10}>{item.title}</Text>
                                </View>
                            </TouchableOpacity>
                            {/* SEPARATOR LINE ADDED HERE */}
                            <View style={[styles.itemSeparator, { backgroundColor: theme.secondary }]} />
                        </View>
                    )}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() => isFetchingMore ? <SkeletonCard /> : <View style={{height: 40}} />}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNews(true)} tintColor={theme.text} />}
                    contentContainerStyle={{ paddingTop: TOTAL_HEADER_HEIGHT }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    skeleton: { backgroundColor: '#F0F0F0' },
    headerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingTop: 25},
    logoArea: { height: LOGO_AREA_HEIGHT, alignItems: 'center', justifyContent: 'center' },
    brandLogo: { width: 120, height: 40 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 15 },
    filterIconBtn: { padding: 10, borderRadius: 12, marginRight: 10, position: 'relative' },
    filterDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, backgroundColor: '#FF3B30', borderRadius: 4, borderWidth: 1.5, borderColor: '#FFF' },
    pill: { paddingHorizontal: 18, height: 42, borderRadius: 12, marginRight: 8, justifyContent: 'center' },
    pillText: { fontSize: 13, color: '#777', fontWeight: '700' },
    categorySeparator: { height: 1, width: '100%' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    dismissArea: { flex: 1 },
    filterSheet: { borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
    sheetHeader: { marginBottom: 20 },
    sheetHandle: { width: 36, height: 5, backgroundColor: '#E5E5E5', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    filterTitle: { fontSize: 26, fontFamily: 'Noe-Display' },
    resetText: { fontSize: 14, fontWeight: '700', color: '#FF3B30' },
    sectionLabel: { fontSize: 11, fontWeight: '900', color: '#BBB', textTransform: 'uppercase', marginBottom: 14 },
    optionGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    optionBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16, marginRight: 10, marginBottom: 10 },
    optionText: { fontSize: 14, fontWeight: '700' },
    applyButton: { paddingVertical: 18, borderRadius: 20, alignItems: 'center' },
    applyText: { fontWeight: '900', fontSize: 16 },
    cardContainer: { width: '100%'},
    card: { paddingHorizontal: 20, paddingVertical: 25 }, // Increased vertical padding
    itemSeparator: { height: 1, marginHorizontal: 20, opacity: 0.8 }, // Clean line style
    publisherRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    publisherLogo: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EEE', marginRight: 8 },
    publisherName: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
    imageWrapper: { width: '100%', height: 230, borderRadius: 24, overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%' },
    cardInfo: { marginTop: 14 },
    cardDate: { fontSize: 11, color: '#AAA', fontWeight: '700', marginBottom: 6 },
    cardTitle: { fontFamily: "Noe-Display", lineHeight: 28 },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: -200 },
    errorTitle: { fontSize: 20, fontFamily: 'Noe-Display', marginTop: 20 },
    errorSubtitle: { fontSize: 14, color: '#AAA', textAlign: 'center', marginTop: 8 },
    retryBtn: { marginTop: 24, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
    retryText: { fontWeight: '700' }
});