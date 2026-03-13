// GeoCheckr — Street View Component
// Free alternatives: Wikimedia Commons, Placeholder images

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Location } from '../data/locations';

interface StreetViewProps {
  location: Location;
  blurAmount?: number; // For difficulty-based blur
}

/**
 * Wikimedia Commons image URLs for major cities
 * These are free to use (Creative Commons)
 */
const WIKIMEDIA_IMAGES: Record<string, string> = {
  "Berlin": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Berlin_-_0224_-_16052017_-_Brandenburger_Tor.jpg/800px-Berlin_-_0224_-_16052017_-_Brandenburger_Tor.jpg",
  "Tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Tokyo_Tower_at_night_2.JPG/800px-Tokyo_Tower_at_night_2.JPG",
  "New York": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabass.jpg/800px-New_york_times_square-terabass.jpg",
  "London": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/London_Montage_L.jpg/800px-London_Montage_L.jpg",
  "Paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Tour_eiffel_at_sunrise_from_the_trocadero.jpg/800px-Tour_eiffel_at_sunrise_from_the_trocadero.jpg",
  "Sydney": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/800px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg",
  "Kairo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/800px-All_Gizah_Pyramids.jpg",
  "Mumbai": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Mumbai_Aug_2018_%2843397784544%29.jpg/800px-Mumbai_Aug_2018_%2843397784544%29.jpg",
  "Rio de Janeiro": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Panorama_of_Corcovado_mountain_and_Christ_the_Redeemer_statue_in_Rio_de_Janeiro.jpg/800px-Panorama_of_Corcovado_mountain_and_Christ_the_Redeemer_statue_in_Rio_de_Janeiro.jpg",
  "Dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/800px-Dubai_Marina_Skyline.jpg",
  "Moskau": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Moscow_July_2011-16.jpg/800px-Moscow_July_2011-16.jpg",
  "Singapur": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Singapore_skyline_at_blue_hour_-_Marina_Bay_Sands_%28cropped%29.jpg/800px-Singapore_skyline_at_blue_hour_-_Marina_Bay_Sands_%28cropped%29.jpg",
};

/**
 * Generate a Street View-like image URL
 * Uses a gradient/pattern based on location for demo
 */
function getImageUrl(location: Location): string {
  // Try Wikimedia first
  if (WIKIMEDIA_IMAGES[location.city]) {
    return WIKIMEDIA_IMAGES[location.city];
  }
  
  // Fallback: Use picsum.photos with location-based seed for consistency
  const seed = location.id * 7 + 42;
  return `https://picsum.photos/seed/${seed}/800/600`;
}

/**
 * Street View Component for GeoCheckr
 * Shows location image with optional blur for difficulty
 */
export default function StreetViewImage({ location, blurAmount = 0 }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    setImageUrl(getImageUrl(location));
    setLoading(true);
    setError(false);
  }, [location]);

  if (!imageUrl) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

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
        style={[
          styles.image,
          blurAmount > 0 && { filter: `blur(${blurAmount}px)` as any }
        ]}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        resizeMode="cover"
      />
      
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>Bild konnte nicht geladen werden</Text>
          <Text style={styles.errorHint}>Studiere die Location-Daten!</Text>
        </View>
      )}
      
      {/* Hint overlay for easier difficulty */}
      <View style={styles.hintBar}>
        <Text style={styles.hintText}>
          📍 {location.region} • {location.continent}
        </Text>
      </View>
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
    fontSize: 18,
    fontWeight: '600',
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
  },
  hintText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
});
