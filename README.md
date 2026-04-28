# Unfold

A minimalist news application built with React Native and Expo, designed for a clean and focused reading experience.

## Overview
Unfold aggregates global headlines into a streamlined, high-performance mobile interface. The project focuses on typography, spacing, and fluid navigation to remove the friction of traditional news browsing.

## Core Features
* **Dynamic News Feed:** Fetches real-time headlines using the Currents API.
* **Gesture Navigation:** Fluid swipe-to-dismiss and transition animations.
* **Optimized Performance:** Efficient list rendering and image caching for smooth scrolling.
* **System Integration:** Built-in support for dark mode and responsive layouts across different Android/iOS screen sizes.

## Project Structure
* `/app`: File-based routing and screen components using Expo Router.
* `/components`: Reusable UI elements (cards, headers, loaders).
* `/constants`: Theme definitions, colors, and API configurations.
* `/assets`: Optimized icons and splash screens.

## Technical Stack
* **Core:** React Native, Expo SDK
* **Language:** TypeScript
* **Networking:** Axios / Fetch API
* **State:** React Context API
* **Deployment:** EAS (Expo Application Services)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/fawasul-rahuman/Unfold.git](https://github.com/fawasul-rahuman/Unfold.git)
   cd Unfold

2. **Install dependencies**
   ```bash
   npm install

3. **Environment Variables**
   Create a .env file in the root directory:
   ```bash
   EXPO_PUBLIC_CURRENTS_API_KEY=your_api_key_here

4. **Start Development Server**
   ```bash
   npx expo start

**Build Instructions**
   To build the production-ready APK for Android:
   ```bash
   eas build -p android --profile preview

**License**
   Unfold - All Rights Reserved.
