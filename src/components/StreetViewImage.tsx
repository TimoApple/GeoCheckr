// GeoCheckr — Street View Image (uses NATIVE Android Activity for 360°)
import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { openStreetView } from '../modules/StreetViewNative';
import { getCityImage } from '../data/locationImages';

interface StreetViewProps {
  location: { 
    city: string; 
    country?: string; 
    region?: string; 
    continent?: string; 
    panoramaUrl?: string; 
    streetViewUrl?: string; 
    lat?: number; 
    lng?: number;
  };
  showInfo?: boolean;
}

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const hasNative360 = !!(location.lat && location.lng);
  
  // Reset when location changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    // Auto-open native Street View when location has coordinates
    // Wrapped in setTimeout to avoid blocking render
    if (location.lat && location.lng) {
      const timer = setTimeout(() => {
        try {
          openStreetView(location.lat!, location.lng!);
        } catch (e) {
          console.warn('Auto-open StreetView failed:', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Flat Image Mode (shown in background while Street View is in separate Activity)
  const imageUrl = getCityImage(location.city);
  
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}
      
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        onLoad={() => setLoading(false)}
        onError={() => { setError(true); setLoading(false); }}
        resizeMode="cover"
      />
      
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>{location.region} • {location.continent}</Text>
        </View>
      )}
      
      {/* 360° Button to re-open Street View */}
      {hasNative360 && (
        <TouchableOpacity 
          style={styles.streetViewButton}
          onPress={() => openStreetView(location.lat!, location.lng!)}
        >
          <Text style={styles.streetViewButtonText}>🌐 Street View öffnen</Text>
        </TouchableOpacity>
      )}
      
      {showInfo && !error && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoText}>{location.city}, {location.country}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  image: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    zIndex: 5,
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#888', fontSize: 14, marginTop: 8 },
  streetViewButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  streetViewButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
