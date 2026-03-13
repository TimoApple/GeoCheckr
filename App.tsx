import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'GeoCheckr' }} />
        <Stack.Screen name="Setup" component={SetupScreen} options={{ title: 'Spiel einrichten' }} />
        <Stack.Screen name="Game" component={GameScreen} options={{ title: 'GeoCheckr', headerShown: false }} />
        <Stack.Screen name="Result" component={ResultScreen} options={{ title: 'Ergebnis' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
