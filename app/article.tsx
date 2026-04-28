import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from "expo-font";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Alert, Dimensions, Image, Linking, Platform, ScrollView,
    Share, StatusBar, StyleSheet, Text, TouchableOpacity, View
} from "react-native";

import { useTheme } from './ThemeContext'; 

const { width } = Dimensions.get('window');
const SAFE_TOP = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 10;

export default function Article() {
    const { theme, textStyles } = useTheme();
    const params = useLocalSearchParams();
    
    // 1. SAFE DATA EXTRACTION
    // useLocalSearchParams can return arrays. This helper ensures we get a string.
    const getString = (val: any) => Array.isArray(val) ? val[0] : val;

    const title = getString(params.title);
    const description = getString(params.description);
    const image = getString(params.image);
    const source = getString(params.source);
    const date = getString(params.date);
    const url = getString(params.url);
    const sourceLogo = getString(params.sourceLogo);
    const from = getString(params.from);

    const [isSaved, setIsSaved] = useState(false);

    const [fontsLoaded] = useFonts({
        "Noe-Display": require("../assets/fonts/NoeDisplay-Bold.ttf"),
        "Noe-Regular": require("../assets/fonts/Noe-Text-Regular.ttf"), // Add your body font here
    });

    useEffect(() => {
        if (title) checkIfSaved();
    }, [title]);

    const checkIfSaved = async () => {
        try {
            const savedData = await AsyncStorage.getItem('saved_articles');
            if (savedData) {
                const articles = JSON.parse(savedData);
                const exists = articles.some((item: any) => item.title === title);
                setIsSaved(exists);
            }
        } catch (e) { console.error(e); }
    };

    const toggleSave = async () => {
        try {
            const savedData = await AsyncStorage.getItem('saved_articles');
            let articles = savedData ? JSON.parse(savedData) : [];
            
            if (isSaved) {
                articles = articles.filter((item: any) => item.title !== title);
                setIsSaved(false);
            } else {
                articles.push({ title, description, image, source, date, url, sourceLogo });
                setIsSaved(true);
            }
            
            await AsyncStorage.setItem('saved_articles', JSON.stringify(articles));
        } catch (e) { 
            Alert.alert("Error", "Could not update bookmarks"); 
        }
    };

    const handleBack = () => {
        if (from === 'saved') router.replace('/saved');
        else router.back(); 
    };

    const onShare = async () => {
        try {
            await Share.share({
                message: `Read this on Unfold: ${title}\n\n${url}`,
                url: url,
            });
        } catch (error: any) { Alert.alert(error.message); }
    };

    if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.id === 'midnight' ? "light-content" : "dark-content"} />
            
            <View style={[styles.fixedNav, { top: SAFE_TOP }]}>
                <TouchableOpacity onPress={handleBack} style={[styles.circleBtn, { backgroundColor: theme.id === 'midnight' ? '#222' : 'rgba(255,255,255,0.9)' }]}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                        onPress={toggleSave} 
                        style={[styles.circleBtn, { backgroundColor: theme.id === 'midnight' ? '#222' : 'rgba(255,255,255,0.9)' }]}
                    >
                        <Ionicons 
                            name={isSaved ? "bookmark" : "bookmark-outline"} 
                            size={22} 
                            color={isSaved ? (theme.id === 'midnight' ? '#FFFFFF' : '#000000') : theme.text} 
                        />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={onShare} 
                        style={[styles.circleBtn, { backgroundColor: theme.id === 'midnight' ? '#222' : 'rgba(255,255,255,0.9)' }]}
                    >
                        <Ionicons name="share-outline" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.imageFrame}>
                    <Image source={{ uri: image || 'https://via.placeholder.com/800' }} style={styles.fullImage} />
                </View>

                <View style={[styles.mainContent, { backgroundColor: theme.bg }]}>
                    <View style={[styles.publisherBar, { backgroundColor: theme.secondary }]}>
                        <Image source={{ uri: sourceLogo || 'https://via.placeholder.com/40' }} style={styles.pubLogo} />
                        <View>
                            <Text style={[styles.pubName, { color: theme.text }]}>{source || "WORLD NEWS"}</Text>
                            <Text style={styles.dateText}>{date || "Just now"}</Text>
                        </View>
                    </View>

                    <Text style={[styles.headline, { 
                        color: theme.text, 
                        fontSize: textStyles.headline, 
                        lineHeight: textStyles.headline * 1.15,
                        letterSpacing: -0.5
                    }]}>
                        {title}
                    </Text>
                    
                    <View style={[styles.divider, { backgroundColor: theme.secondary }]} />
                    
                    {/* 2. DESCRIPTION RENDER FIX */}
                    <Text style={[styles.bodyText, { 
                        color: theme.text, 
                        fontSize: textStyles.body, 
                        lineHeight: textStyles.lineHeight,
                        fontFamily: "Noe-Regular" // <--- Add this line
                    }]}>
                        {description || "No content available for this article."}
                    </Text>
                    
                    <TouchableOpacity 
                        style={[styles.readMoreBtn, { backgroundColor: theme.text }]} 
                        onPress={() => url && Linking.openURL(url)}
                    >
                        <Text style={[styles.readMoreText, { color: theme.bg }]}>Read Source Article</Text>
                        <Ionicons name="arrow-forward" size={18} color={theme.bg} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fixedNav: { position: 'absolute', left: 0, right: 0, zIndex: 100, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    scrollContent: { flexGrow: 1 },
    imageFrame: { width: width, height: 480 },
    fullImage: { width: '100%', height: '100%' },
    mainContent: { padding: 25, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -40, minHeight: 600 },
    publisherBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 12, borderRadius: 16 },
    pubLogo: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
    pubName: { fontWeight: '900', fontSize: 13, textTransform: 'uppercase' },
    dateText: { fontSize: 11, color: '#888', marginTop: 2 },
    headline: { fontFamily: "Noe-Display", marginBottom: 20 },
    divider: { height: 1, width: '40%', marginBottom: 25 },
    bodyText: { fontWeight: '400' },
    readMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, marginTop: 40, gap: 12, },
    readMoreText: { fontSize: 16, fontWeight: '800' }
});