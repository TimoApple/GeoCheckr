import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import TutorialScreen from './src/screens/TutorialScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [showTutorial, setShowTutorial] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
    requestMicPermission();
  }, []);

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'GeoCheckr Mikrofon',
            message: 'GeoCheckr benötigt Mikrofon für Spracheingabe',
            buttonPositive: 'Erlauben',
            buttonNegative: 'Später',
          }
        );
      } catch (e) {}
    }
  };

  const checkFirstLaunch = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('geocheckr_tutorial_done');
      setShowTutorial(hasSeenTutorial !== 'true');
    } catch {
      setShowTutorial(false);
    }
  };

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem('geocheckr_tutorial_done', 'true');
    } catch {}
    setShowTutorial(false);
  };

  if (showTutorial === null) {
    return null; // Loading
  }

  if (showTutorial) {
    return <TutorialScreen onComplete={handleTutorialComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Setup" 
          component={SetupScreen}
          options={{ title: 'Spiel einrichten' }}
        />
        <Stack.Screen 
          name="Game" 
          component={GameScreen}
          options={{ title: 'GeoCheckr', headerBackVisible: false }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ title: 'Spielende', headerBackVisible: false }}
        />
        <Stack.Screen 
          name="Tutorial" 
          component={TutorialScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
