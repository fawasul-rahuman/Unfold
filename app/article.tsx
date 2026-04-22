import { Ionicons } from '@expo/vector-icons';
import { useFonts } from "expo-font";
import { router, useLocalSearchParams } from "expo-router";
import {
	Alert // Added
	,







	Dimensions,
	Image,
	Linking,
	Platform,
	ScrollView,
	Share,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";

const { width } = Dimensions.get('window');
const SAFE_TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

export default function Article() {
    const { title, description, image, source, date, url, sourceLogo } = useLocalSearchParams();

    const [fontsLoaded] = useFonts({
        "Noe-Display": require("../assets/fonts/NoeDisplay-Bold.ttf"),
    });

    const openOriginal = () => {
        const safeUrl = Array.isArray(url) ? url[0] : url;
        if (safeUrl) Linking.openURL(safeUrl);
    };

    // Native Share Function
    const onShare = async () => {
        try {
            const safeUrl = Array.isArray(url) ? url[0] : url;
            await Share.share({
                message: `Read this on Unfold: ${title}\n\n${safeUrl}`,
                url: safeUrl, // iOS specific
                title: 'Unfold News'
            });
        } catch (error: any) {
            Alert.alert(error.message);
        }
    };

    if (!fontsLoaded) return null;

    const fullArticleBody = typeof description === 'string' ? description : "Content loading...";

    return (
        <View style={styles.container}>
            <View style={[styles.fixedNav, { top: SAFE_TOP }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.circleBtn}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                {/* Fixed to trigger Share instead of opening link */}
                <TouchableOpacity onPress={onShare} style={styles.circleBtn}>
                    <Ionicons name="share-outline" size={22} color="black" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} bounces={true} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageFrame}>
                    <Image source={{ uri: (image as string) || 'https://via.placeholder.com/800' }} style={styles.fullImage} />
                </View>

                <View style={styles.mainContent}>
                    <View style={styles.publisherBar}>
                        <Image source={{ uri: (sourceLogo as string) || 'https://via.placeholder.com/40' }} style={styles.pubLogo} />
                        <View>
                            <Text style={styles.pubName}>{source || "WORLD NEWS"}</Text>
                            <Text style={styles.dateText}>{date || "Just now"}</Text>
                        </View>
                    </View>

                    <Text style={styles.headline}>{title}</Text>
                    <View style={styles.divider} />

                    <Text style={styles.bodyText}>{fullArticleBody}</Text>
                    
                    <TouchableOpacity style={styles.readMoreBtn} onPress={openOriginal}>
                        <Text style={styles.readMoreText}>Read Source Article</Text>
                        <Ionicons name="arrow-forward" size={18} color="white" />
                    </TouchableOpacity>
                </View>
                <View style={{ height: 0 }} />
            </ScrollView>
        </View>
    );
}

// Styles remain exactly as you provided...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF" },
    fixedNav: { position: 'absolute', left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    circleBtn: { backgroundColor: 'rgba(255,255,255,0.95)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.1, elevation: 5 },
    scrollContent: { flexGrow: 1 },
    imageFrame: { width: width, height: 480 },
    fullImage: { width: '100%', height: '100%' },
    mainContent: { padding: 25, backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -40 },
    publisherBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 16 },
    pubLogo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEE', marginRight: 12 },
    pubName: { fontWeight: '900', fontSize: 13, letterSpacing: 0.5, color: '#000', textTransform: 'uppercase' },
    dateText: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },
    headline: { fontSize: 32, fontFamily: "Noe-Display", lineHeight: 40, color: '#000', marginBottom: 20 },
    divider: { height: 1, backgroundColor: '#F0F0F0', width: '40%', marginBottom: 25 },
    bodyText: { fontSize: 19, lineHeight: 32, color: '#222', fontWeight: '400', textAlign: 'left' },
    readMoreBtn: { backgroundColor: '#000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, marginTop: 30, gap: 12 },
    readMoreText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});