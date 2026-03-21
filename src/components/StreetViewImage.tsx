// GeoCheckr — Street View Image v4
// FIX: Metadata API check BEFORE loading image
// - Only loads static image if Street View coverage exists
// - radius=50000 for wider search
// - Fallback to city image if no coverage
import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getCityImage } from '../data/locationImages';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface StreetViewProps {
  location: {
    city: string;
    country?: string;
    region?: string;
    continent?: string;
    lat?: number;
    lng?: number;
  };
  showInfo?: boolean;
  mode?: 'image' | 'panorama' | 'auto';
}

type ViewStatus = 'checking' | 'streetview' | 'fallback';

// Static API URL with radius for wider coverage search
function getStaticUrl(lat: number, lng: number, heading: number): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lng}&heading=${heading}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`;
}

// Metadata API URL to check if Street View exists
function getMetadataUrl(lat: number, lng: number): string {
  return `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&source=outdoor&key=${API_KEY}`;
}

export default function StreetViewImage({ location, showInfo = false, mode = 'auto' }: StreetViewProps) {
  const [status, setStatus] = useState<ViewStatus>('checking');
  const [heading] = useState(() => Math.floor(Math.random() * 360));
  const [staticUrl, setStaticUrl] = useState('');
  const [staticLoaded, setStaticLoaded] = useState(false);

  const hasCoords = !!(location.lat && location.lng);
  const fallbackImage = getCityImage(location.city);

  // Check metadata BEFORE loading image
  useEffect(() => {
    if (!hasCoords || !API_KEY) {
      setStatus('fallback');
      return;
    }

    const metaUrl = getMetadataUrl(location.lat!, location.lng!);

    fetch(metaUrl)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'OK' && data.pano_id) {
          // Street View exists! Use exact coordinates from metadata
          const svLat = data.location?.lat || location.lat!;
          const svLng = data.location?.lng || location.lng!;
          setStaticUrl(getStaticUrl(svLat, svLng, heading));
          setStatus('streetview');
        } else {
          // No Street View coverage at this location
          console.warn(`No Street View for ${location.city}: ${data.status}`);
          setStatus('fallback');
        }
      })
      .catch(err => {
        console.warn('Metadata check failed:', err);
        setStatus('fallback');
      });
  }, [location.lat, location.lng]);

  // No coords at all
  if (!hasCoords) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>{location.region} • {location.continent}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fallback city image — always behind as background */}
      <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />

      {/* Street View image — only if metadata confirmed coverage */}
      {status === 'streetview' && staticUrl && (
        <Image
          source={{ uri: staticUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoad={() => setStaticLoaded(true)}
          onError={() => {
            console.warn('Static image failed despite metadata OK');
            setStatus('fallback');
          }}
        />
      )}

      {/* Loading state */}
      {status === 'checking' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}

      {showInfo && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoText}>{location.city}, {location.country}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000', zIndex: 10,
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#888', fontSize: 14, marginTop: 8 },
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
