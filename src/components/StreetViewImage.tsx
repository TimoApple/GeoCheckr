// GeoCheckr — Street View Component
// Uses reliable Unsplash images with fallback

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Location } from '../types/location';
import Panorama360Viewer from './Panorama360Viewer';
import { getCityImage, getPlaceholderImage } from '../data/locationImages';

interface StreetViewProps {
  location: Location;
  showInfo?: boolean;
}

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<'360' | 'flat'>('flat');
  const [imageInfo, setImageInfo] = useState<{ url: string; is360: boolean }>({ url: '', is360: false });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const url = getCityImage(location.city);
    setImageInfo({ url, is360: false });
    setViewMode('flat');
    setLoading(true);
    setError(false);
    setRetryCount(0);
  }, [location]);

  const handleError = () => {
    if (retryCount === 0) {
      // First retry: try without query params (cleaner URL)
      setImageInfo({ url: getPlaceholderImage(location.city, location.id), is360: false });
      setRetryCount(1);
    } else {
      setError(true);
      setLoading(false);
    }
  };

  // Regular Image Mode
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Bild...</Text>
        </View>
      )}
      
      <Image
        source={{ uri: imageInfo.url }}
        style={styles.image}
        onLoad={() => setLoading(false)}
        onError={handleError}
        resizeMode="cover"
      />
      
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>{location.region} • {location.continent}</Text>
        </View>
      )}
      
      {/* Region hint - only when showInfo is true */}
      {showInfo && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            📍 {location.region} • {location.continent}
          </Text>
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
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  errorHint: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
  hintBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintText: {
    color: '#aaa',
    fontSize: 12,
  },
});
