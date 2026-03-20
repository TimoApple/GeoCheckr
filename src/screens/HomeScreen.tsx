import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [userName, setUserName] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadUserName();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
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
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[styles.topSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.globeContainer}>
          <Text style={styles.globe}>🌍</Text>
        </View>
        <Text style={styles.title}>GeoCheckr</Text>
        <Text style={styles.subtitle}>Finde den Ort.{'\n'}Gewinne das Spiel.</Text>
      </Animated.View>

      <Animated.View 
        style={[styles.bottomSection, { opacity: fadeAnim }]}
      >
        {userName && (
          <Text style={styles.greeting}>Willkommen zurück, {userName}</Text>
        )}

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Setup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Neues Spiel</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryRow}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Tutorial')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Anleitung</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={resetTutorial}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Tutorial</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Basis-Edition</Text>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>200 Locations</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a14',
    paddingHorizontal: 24,
    paddingTop: height * 0.08,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  globeContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#12121f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  globe: { fontSize: 48 },
  title: { 
    fontSize: 36, 
    fontWeight: '700', 
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: { 
    fontSize: 17, 
    color: '#8888aa', 
    textAlign: 'center',
    lineHeight: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6666aa',
    textAlign: 'center',
    marginBottom: 20,
  },
  bottomSection: { width: '100%' },
  primaryButton: { 
    backgroundColor: '#ff3333', 
    paddingVertical: 16, 
    borderRadius: 14, 
    marginBottom: 14,
    alignItems: 'center',
  },
  primaryButtonText: { 
    color: '#fff', 
    fontSize: 17, 
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: { 
    flex: 1,
    backgroundColor: '#12121f', 
    paddingVertical: 14, 
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  secondaryButtonText: { 
    color: '#8888aa', 
    fontSize: 15,
    fontWeight: '500',
  },
  footer: { 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
  },
  footerText: { 
    color: '#444466', 
    fontSize: 12,
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#444466',
  },
});
