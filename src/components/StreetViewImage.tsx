// GeoCheckr — Street View Component
// Shows 360° panorama by default when available, falls back to image

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Location } from '../types/location';
import Panorama360Viewer from './Panorama360Viewer';
import { getCityImage } from '../data/locationImages';

interface StreetViewProps {
  location: { city: string; country?: string; region?: string; continent?: string; panoramaUrl?: string; streetViewUrl?: string; lat?: number; lng?: number };
  showInfo?: boolean;
}

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useFlatImage, setUseFlatImage] = useState(false);
  
  const panoramaLink = location.panoramaUrl || location.streetViewUrl || '';
  const has360 = !!panoramaLink;
  
  useEffect(() => {
    setLoading(true);
    setError(false);
    setUseFlatImage(false);
  }, [location]);

  // 360° Panorama Mode (DEFAULT when available)
  if (has360 && !useFlatImage) {
    return (
      <View style={styles.container}>
        <Panorama360Viewer 
          imageUrl={panoramaLink} 
          locationName={location.city}
        />
      </View>
    );
  }

  // Flat Image Mode (fallback or when no panorama)
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
      {has360 && (
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setUseFlatImage(false)}
        >
          <Text style={styles.toggleText}>🌐 360°</Text>
        </TouchableOpacity>
      )}
      
      {showInfo && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>📍 {location.region} • {location.continent}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#16213e',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  errorHint: { color: '#888', fontSize: 14, marginTop: 10 },
  toggleButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  toggleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cityOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cityName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hintBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
  },
  hintText: { color: '#aaa', fontSize: 12 },
});
