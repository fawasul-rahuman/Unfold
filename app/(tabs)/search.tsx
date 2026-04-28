import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, useEffect } from 'react';
import { 
    View, TextInput, TouchableOpacity, StyleSheet, FlatList, 
    Text, Image, ActivityIndicator, Dimensions, StatusBar, 
    ScrollView, Keyboard 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router'; // Added useLocalSearchParams
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../ThemeContext';

const { width } = Dimensions.get('window');

const CURRENTS_KEY = "KS6yMcbot04xJerKFpXz7YuP0N5Mxx6dOdJxzpeF3ijyAuKN";
const TRENDING_KEYWORDS = ['Cybersecurity', 'Electric Jets', 'Quantum Tech', 'Market 2026', 'SpaceX', 'Neuralink'];

export default function SearchScreen() {
    const { theme, fontSize, textStyles } = useTheme(); // Added textStyles for scaling
    const { autoFocus } = useLocalSearchParams(); // Capture the hold-to-search param
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    const titleSize = fontSize === 'Compact' ? 15 : fontSize === 'Large' ? 20 : 17;

    const [fontsLoaded] = useFonts({
        "Noe-Display": require("../../assets/fonts/NoeDisplay-Bold.ttf"),
        "Noe-Regular": require("../../assets/fonts/Noe-Text-Regular.ttf"), // Integrated new font
    });

    // --- KEYBOARD AUTO-FOCUS LOGIC ---
    useEffect(() => {
        if (autoFocus === 'true') {
            const timer = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 150); // Delay allows the tab transition to finish
            return () => clearTimeout(timer);
        }
    }, [autoFocus]);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        const saved = await AsyncStorage.getItem('@search_history');
        if (saved) setHistory(JSON.parse(saved));
    };

    const saveToHistory = async (query: string) => {
        if (!query.trim() || query.length < 2) return;
        const newHistory = [query, ...history.filter(i => i !== query)].slice(0, 5);
        setHistory(newHistory);
        await AsyncStorage.setItem('@search_history', JSON.stringify(newHistory));
    };

    const clearHistory = async () => {
        setHistory([]);
        await AsyncStorage.removeItem('@search_history');
    };

    const performSearch = async (query: string) => {
        const trimmed = query.trim();
        if (!trimmed || trimmed.length < 2) return;
        
        setLoading(true);
        saveToHistory(trimmed);

        try {
            const url = `https://api.currentsapi.services/v1/search?keywords=${encodeURIComponent(trimmed)}&language=en&apiKey=${CURRENTS_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === "ok" && data.news && data.news.length > 0) {
                setResults(data.news.map((item: any) => ({
                    title: item.title || "No Title",
                    image: item.image !== "None" ? item.image : 'https://images.unsplash.com/photo-1504711432869-efd597cdd042',
                    source: item.author?.toUpperCase() || "NEWS",
                    url: item.url,
                    date: item.published,
                    description: item.description // Ensure description is passed to article screen
                })));
            } else {
                setResults([]);
            }
        } catch (err) { 
            console.error("Currents API Error:", err);
            setResults([]); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        if (searchQuery.length > 0) {
            const filtered = [...new Set([...TRENDING_KEYWORDS, ...history])].filter(i => 
                i.toLowerCase().includes(searchQuery.toLowerCase()) && i.toLowerCase() !== searchQuery.toLowerCase()
            );
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
            setResults([]);
        }

        const delay = setTimeout(() => { 
            if (searchQuery.trim().length >= 2) performSearch(searchQuery);
        }, 1000);

        return () => clearTimeout(delay);
    }, [searchQuery]);

    if (!fontsLoaded) return <View style={[styles.center, {backgroundColor: theme.bg}]}><ActivityIndicator color={theme.text} /></View>;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.id === 'midnight' ? "light-content" : "dark-content"} />
            
            <View style={styles.header}>
                <Text style={[styles.giantTitle, { color: theme.text }]}>Discover</Text>
                <View style={[
                    styles.searchPill, 
                    { backgroundColor: theme.secondary },
                    isFocused && { borderColor: theme.text, borderWidth: 1.5, backgroundColor: theme.bg }
                ]}>
                    <Ionicons name="search" size={20} color={theme.text} />
                    <TextInput
                        ref={searchInputRef}
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Search Articles"
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={() => performSearch(searchQuery)}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => {setSearchQuery(""); setResults([]);}}>
                            <Ionicons name="close-circle" size={20} color={theme.text} style={{ opacity: 0.4 }} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.text} size="large" />
                    <Text style={{marginTop: 10, color: theme.text, fontSize: 10, fontWeight: '800', opacity: 0.5}}>SEARCHING</Text>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {searchQuery.length > 0 && results.length > 0 ? (
                        <FlatList
                            data={results}
                            keyExtractor={(_, i) => i.toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    activeOpacity={0.8}
                                    style={styles.listCard} 
                                    onPress={() => router.push({ pathname: "/article", params: item })}
                                >
                                    <Image source={{ uri: item.image }} style={styles.listThumb} />
                                    <View style={styles.listText}>
                                        <Text style={[styles.listSource, { color: theme.text, opacity: 0.5 }]}>{item.source}</Text>
                                        <Text style={[styles.listTitle, { color: theme.text, fontSize: titleSize }]} numberOfLines={2}>{item.title}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {searchQuery.length > 1 && results.length === 0 && !loading && (
                                <View style={[styles.center, { marginTop: 40 }]}>
                                    <Text style={{ color: theme.text, opacity: 0.5, fontFamily: "Noe-Regular" }}>No results found</Text>
                                </View>
                            )}

                            {searchQuery.length === 0 && history.length > 0 && (
                                <View style={styles.section}>
                                    <View style={styles.labelRow}>
                                        <Text style={styles.label}>RECENT SEARCHES</Text>
                                        <TouchableOpacity onPress={clearHistory}><Text style={styles.clearText}>Clear</Text></TouchableOpacity>
                                    </View>
                                    {history.map((h, i) => (
                                        <TouchableOpacity key={i} style={styles.historyItem} onPress={() => setSearchQuery(h)}>
                                            <Ionicons name="time-outline" size={18} color={theme.text} style={{ opacity: 0.3 }} />
                                            <Text style={[styles.historyText, { color: theme.text, fontFamily: "Noe-Regular" }]}>{h}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            {searchQuery.length === 0 && (
                                <>
                                    <View style={styles.section}>
                                        <Text style={[styles.label, { paddingHorizontal: 20 }]}>TRENDING NOW</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 20, marginTop: 15 }}>
                                            {TRENDING_KEYWORDS.map((t, i) => (
                                                <TouchableOpacity key={i} style={[styles.trendPill, { backgroundColor: theme.text }]} onPress={() => setSearchQuery(t)}>
                                                    <Text style={[styles.trendText, { color: theme.bg }]}>#{t}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View style={[styles.section, { marginBottom: 40 }]}>
                                        <Text style={[styles.label, { paddingHorizontal: 20 }]}>CATEGORIES</Text>
                                        <View style={[styles.grid, { marginTop: 10 }]}>
                                            {['Technology', 'Economy', 'Science', 'Style', 'Auto', 'Health'].map((c, i) => (
                                                <TouchableOpacity key={i} style={[styles.gridBtn, { backgroundColor: theme.secondary, borderColor: theme.secondary }]} onPress={() => setSearchQuery(c)}>
                                                    <Text style={[styles.gridBtnText, { color: theme.text }]}>{c}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 35 },
    header: { paddingHorizontal: 20, marginBottom: 15 },
    giantTitle: { fontSize: 40, fontFamily: "Noe-Display", letterSpacing: -1.5, lineHeight: 56 },
    searchPill: { flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 20, paddingHorizontal: 20, marginTop: 20 },
    input: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '700' },
    section: { marginTop: 35 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 2, textTransform: 'uppercase' },
    clearText: { fontSize: 12, fontWeight: '700', color: '#FF3B30' },
    historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20 },
    historyText: { marginLeft: 15, fontSize: 16 },
    trendPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, marginRight: 8 },
    trendText: { fontWeight: '900', fontSize: 13 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15 },
    gridBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, margin: 5, borderWidth: 1 },
    gridBtnText: { fontWeight: '800', fontSize: 13 },
    listCard: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, marginTop: 10, alignItems: 'center' },
    listThumb: { width: 85, height: 85, borderRadius: 18, backgroundColor: '#EEE' },
    listText: { flex: 1, marginLeft: 18 },
    listSource: { fontSize: 9, fontWeight: '900', marginBottom: 6, textTransform: 'uppercase' },
    listTitle: { fontFamily: "Noe-Display", lineHeight: 22 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});