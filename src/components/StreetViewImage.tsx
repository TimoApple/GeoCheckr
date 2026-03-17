// GeoCheckr — Street View Image (uses NATIVE Android SDK, not WebView)
import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import NativeStreetView from './NativeStreetView';
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
  const [useFlatImage, setUseFlatImage] = useState(false);
  
  const hasNative360 = !!(location.lat && location.lng);
  
  // Reset when location changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    setUseFlatImage(false);
  }, [location]);

  // 360° Panorama Mode — NATIVE Android SDK (no WebView!)
  if (hasNative360 && !useFlatImage) {
    return (
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8343ff" />
          </View>
        )}
        <NativeStreetView 
          lat={location.lat!} 
          lng={location.lng!} 
          style={styles.image}
        />
        {showInfo && (
          <View style={styles.infoOverlay}>
            <Text style={styles.infoText}>{location.city}</Text>
          </View>
        )}
      </View>
    );
  }

  // Flat Image Mode (fallback)
  const imageUrl = getCityImage(location.city);
  
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Bild...</Text>
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
      
      {/* 360° Toggle if panorama available */}
      {hasNative360 && (
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setUseFlatImage(false)}
        >
          <Text style={styles.toggleText}>🌐 360°</Text>
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
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  toggleText: { color: '#fff', fontSize: 14 },
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
