import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';

interface StreetViewProps {
  lat: number;
  lng: number;
  heading?: number;
}

export default function StreetViewImage({ lat, lng, heading = 0 }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Use Mapillary (free) as primary, fallback to placeholder
  const mapillaryUrl = `https://images.mapillary.com/placeholder?lat=${lat}&lng=${lng}`;
  
  // Static map from OSM as fallback
  const osmUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=400x300&markers=${lat},${lng},red-pushpin`;
  
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🌍</Text>
          <Text style={styles.placeholderText}>Koordinaten:</Text>
          <Text style={styles.coords}>{lat.toFixed(4)}°, {lng.toFixed(4)}°</Text>
          <Text style={styles.hint}>Nutze Spracheingabe für deine Antwort</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Bild...</Text>
        </View>
      )}
      <Image
        source={{ uri: osmUrl }}
        style={styles.image}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 250, borderRadius: 15, overflow: 'hidden', backgroundColor: '#16213e' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  loadingContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#ccc', marginTop: 10, fontSize: 14 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderEmoji: { fontSize: 50, marginBottom: 10 },
  placeholderText: { color: '#ccc', fontSize: 16, marginBottom: 5 },
  coords: { color: '#e94560', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  hint: { color: '#666', fontSize: 14, textAlign: 'center' },
});
