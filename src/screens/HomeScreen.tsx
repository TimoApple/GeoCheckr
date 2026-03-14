import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState<string | null>(null);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    loadUserName();
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem('geocheckr_user_name');
      if (name) setUserName(name);
    } catch {}
  };

  const resetTutorial = async () => {
    try {
      await AsyncStorage.removeItem('geocheckr_tutorial_seen');
      await AsyncStorage.removeItem('geocheckr_tutorial_done');
    } catch {}
    navigation.navigate('Tutorial');
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.logo}>🌍</Text>
        <Text style={styles.title}>GeoCheckr</Text>
        <Text style={styles.subtitle}>Finde den Ort. Gewinne das Spiel.</Text>
        {userName && (
          <Text style={styles.greeting}>Willkommen zurück, {userName}! 👋</Text>
        )}
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.buttonContainer, 
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Setup')}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>🎮 Neues Spiel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Tutorial')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>📖 Anleitung</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={resetTutorial}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>🔄 Tutorial neu anzeigen</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Basis-Edition • 200 Locations</Text>
        <Text style={styles.footerVersion}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a2e', 
    padding: 20,
    justifyContent: 'space-between',
  },
  logoContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  logo: { 
    fontSize: 80, 
    marginBottom: 15 
  },
  title: { 
    fontSize: 42, 
    fontWeight: 'bold', 
    color: '#e94560', 
    marginBottom: 8 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#a0a0b0', 
    textAlign: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 10,
  },
  buttonContainer: { 
    width: '100%', 
    marginBottom: 30 
  },
  primaryButton: { 
    backgroundColor: '#e94560', 
    paddingVertical: 18, 
    borderRadius: 12, 
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: { 
    color: '#fff', 
    fontSize: 20, 
    fontWeight: 'bold' 
  },
  secondaryButton: { 
    backgroundColor: '#16213e', 
    paddingVertical: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  secondaryButtonText: { 
    color: '#ccc', 
    fontSize: 16 
  },
  footer: { 
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: { 
    color: '#555', 
    fontSize: 12 
  },
  footerVersion: {
    color: '#444',
    fontSize: 10,
    marginTop: 4,
  },
});
