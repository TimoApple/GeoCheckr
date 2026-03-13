import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🌍</Text>
        <Text style={styles.title}>GeoCheckr</Text>
        <Text style={styles.subtitle}>Finde den Ort. Gewinne das Spiel.</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Setup')}
        >
          <Text style={styles.primaryButtonText}>🎮 Neues Spiel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>📖 Anleitung</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>⚙️ Einstellungen</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Basis-Edition</Text>
        <Text style={styles.footerText}>200 Locations weltweit</Text>
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
    textAlign: 'center' 
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
});
