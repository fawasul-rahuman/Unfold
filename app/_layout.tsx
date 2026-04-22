import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

export default function Layout() {
    const [loaded, error] = useFonts({
        // Updated to the correct relative path
        "Noe-Display": require("../assets/fonts/NoeDisplay-Bold.ttf"),
    });

    useEffect(() => {
        if (error) {
            console.error("Font failed to load:", error);
        }
    }, [error]);

    useEffect(() => {
        if (loaded) {
            // Hide splash screen only when fonts are ready
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) return null;
	return (
		<Stack 
			screenOptions={{ 
				headerShown: false,
				contentStyle: { backgroundColor: '#000000' } 
			}} 
		/>
	);
}