// GeoCheckr — Street View Component
// Uses reliable Unsplash images with 360° panorama toggle

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
  const [retryCount, setRetryCount] = useState(0);

  const imageUrl = getCityImage(location.city);
  const has360 = !!location.streetViewUrl;

  useEffect(() => {
    setViewMode('flat');
    setLoading(true);
    setError(false);
    setRetryCount(0);
  }, [location]);

  const handleError = () => {
    if (retryCount === 0) {
      setRetryCount(1);
      // Will trigger re-render with placeholder via getPlaceholderImage
    } else {
      setError(true);
      setLoading(false);
    }
  };

  const getImageUrl = () => {
    if (retryCount === 0) return imageUrl;
    return getPlaceholderImage(location.city, location.id);
  };

  // 360° Panorama Mode
  if (viewMode === '360' && has360) {
    return (
      <View style={styles.container}>
        <Panorama360Viewer 
          imageUrl={location.streetViewUrl!} 
          locationName={location.city}
        />
        {/* Toggle back to flat */}
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setViewMode('flat')}
        >
          <Text style={styles.toggleText}>📷 Normal</Text>
        </TouchableOpacity>
        {/* City name overlay */}
        <View style={styles.cityOverlay}>
          <Text style={styles.cityName}>{location.city}</Text>
        </View>
      </View>
    );
  }

  // Regular Image Mode (default)
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Bild...</Text>
        </View>
      )}
      
      <Image
        source={{ uri: getImageUrl() }}
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
      
      {/* 360° Toggle Button */}
      {has360 && !error && (
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => setViewMode('360')}
        >
          <Text style={styles.toggleText}>🌐 360°</Text>
        </TouchableOpacity>
      )}
      
      {/* Region hint */}
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
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cityOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cityName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
