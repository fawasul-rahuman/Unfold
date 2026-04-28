import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useTheme, THEMES } from '../ThemeContext';

const { width } = Dimensions.get('window');

export default function LabScreen() {
    // 1. Destructure textStyles to make scaling work
    const { theme, updateTheme, fontSize, updateFontSize, textStyles } = useTheme();

    const [fontsLoaded] = useFonts({
        "Noe-Display": require("../../assets/fonts/NoeDisplay-Bold.ttf"),
        "Noe-Regular": require("../../assets/fonts/Noe-Text-Regular.ttf"), 
    });

    if (!fontsLoaded) return null;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar barStyle={theme.id === 'midnight' ? "light-content" : "dark-content"} />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={[styles.giantTitle, { color: theme.text }]}>The Lab</Text>
                    <Text style={styles.subtitle}>Calibrate your reading experience.</Text>
                </View>

                {/* Visual Environment Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Visual Environment</Text>
                    <View style={styles.themeGrid}>
                        {THEMES.map((t) => (
                            <TouchableOpacity 
                                key={t.id} 
                                style={[
                                    styles.themeCard, 
                                    { 
                                        backgroundColor: t.bg, 
                                        borderColor: theme.id === t.id ? theme.text : (theme.id === 'midnight' ? '#333' : '#EEE') 
                                    }
                                ]}
                                onPress={() => updateTheme(t)}
                            >
                                <View style={[styles.themeCircle, { backgroundColor: t.text }]} />
                                <Text style={[styles.themeLabel, { color: t.id === 'midnight' && theme.id !== 'midnight' ? '#AAA' : t.text }]}>
                                    {t.label}
                                </Text>
                                {theme.id === t.id && (
                                    <Ionicons 
                                        name="checkmark-circle" 
                                        size={20} 
                                        color={theme.id === 'midnight' ? '#FFF' : '#000'} 
                                        style={styles.checkIcon} 
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Optical Scaling Section */}
                <View style={styles.section}>
                    <Text style={styles.label}>Optical Scaling</Text>
                    <View style={[styles.controlBox, { backgroundColor: theme.secondary }]}>
                        {['Compact', 'Medium', 'Large'].map((size) => (
                            <TouchableOpacity 
                                key={size} 
                                style={[
                                    styles.sizeBtn, 
                                    fontSize === size && { backgroundColor: theme.text }
                                ]}
                                onPress={() => updateFontSize(size)}
                            >
                                <Text style={[
                                    styles.sizeBtnText, 
                                    { color: fontSize === size ? theme.bg : '#888' }
                                ]}>
                                    {size}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Live Preview Section - FIXED SCALING */}
                <View style={styles.section}>
                    <Text style={styles.label}>Live Preview</Text>
                    <View style={[styles.previewBox, { backgroundColor: theme.secondary }]}>
                        <Text style={[styles.previewTitle, { 
                            color: theme.text, 
                            fontSize: textStyles.headline, // Scales dynamically
                            lineHeight: textStyles.headline * 1.1 
                        }]}>
                            The future of news is minimalist.
                        </Text>
                        
                        <Text style={[styles.previewBody, { 
                            color: theme.text, 
                            opacity: 0.7,
                            fontFamily: "Noe-Regular", // Added your custom font
                            fontSize: textStyles.body,      // Scales dynamically
                            lineHeight: textStyles.lineHeight // Scales dynamically
                        }]}>
                            This is how your articles will appear in Unfold. Clean and calibrated for high-focus reading.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 35, paddingBottom: 100 },
    header: { paddingHorizontal: 20, marginBottom: -20 },
    giantTitle: { fontSize: 40, fontFamily: "Noe-Display", letterSpacing: -1.5, lineHeight: 56 },
    subtitle: { fontSize: 16, color: '#888', marginTop: 5, fontWeight: '500' },
    section: { marginTop: 35, paddingHorizontal: 20 },
    label: { fontSize: 10, fontWeight: '900', color: '#BBB', letterSpacing: 2, marginBottom: 15, textTransform: 'uppercase' },
    themeGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    themeCard: { width: (width - 60) / 3, height: 100, borderRadius: 20, borderWidth: 2, padding: 12, justifyContent: 'space-between' },
    themeCircle: { width: 24, height: 24, borderRadius: 12 },
    themeLabel: { fontSize: 13, fontWeight: '800' },
    checkIcon: { position: 'absolute', top: 10, right: 10 },
    controlBox: { flexDirection: 'row', borderRadius: 20, padding: 6 },
    sizeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 16 },
    sizeBtnText: { fontSize: 14, fontWeight: '700' },
    previewBox: { padding: 25, borderRadius: 30, marginTop: 5 },
    previewTitle: { fontFamily: "Noe-Display", marginBottom: 10 },
    previewBody: { fontWeight: '500' }
});