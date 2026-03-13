import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

interface MapViewProps {
  lat: number;
  lng: number;
  onCitySelect?: (city: string, lat: number, lng: number) => void;
}

export default function MapView({ lat, lng, onCitySelect }: MapViewProps) {
  // Static OSM map for display
  const mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=10&size=400x300&markers=${lat},${lng},red-pushpin`;
  
  const openInBrowser = () => {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=10`);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Ort wählen</Text>
      
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>Karte wird geladen...</Text>
        <Text style={styles.coords}>{lat.toFixed(4)}°, {lng.toFixed(4)}°</Text>
      </View>
      
      <View style={styles.cityButtons}>
        <Text style={styles.cityTitle}>Wähle die nächste Stadt:</Text>
        <View style={styles.cityGrid}>
          {['Berlin', 'Paris', 'Tokyo', 'New York', 'Sydney', 'Mumbai'].map(city => (
            <TouchableOpacity 
              key={city} 
              style={styles.cityButton}
              onPress={() => onCitySelect && onCitySelect(city, 0, 0)}
            >
              <Text style={styles.cityText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity style={styles.browserButton} onPress={openInBrowser}>
        <Text style={styles.browserButtonText}>🌐 In Karte öffnen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { color: '#e94560', fontSize: 20, fontWeight: '600', marginBottom: 15, textAlign: 'center' },
  mapPlaceholder: { 
    height: 200, 
    backgroundColor: '#16213e', 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2a4a'
  },
  mapEmoji: { fontSize: 50, marginBottom: 10 },
  mapText: { color: '#888', fontSize: 16 },
  coords: { color: '#e94560', fontSize: 14, marginTop: 5 },
  cityButtons: { marginBottom: 20 },
  cityTitle: { color: '#fff', fontSize: 16, marginBottom: 10, textAlign: 'center' },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  cityButton: { 
    backgroundColor: '#0f3460', 
    padding: 12, 
    borderRadius: 8, 
    margin: 5, 
    minWidth: 100, 
    alignItems: 'center' 
  },
  cityText: { color: '#fff', fontSize: 14 },
  browserButton: { backgroundColor: '#16213e', padding: 15, borderRadius: 10, alignItems: 'center' },
  browserButtonText: { color: '#ccc', fontSize: 16 },
});
