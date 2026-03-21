// GeoCheckr — Street View v8
// NO WebView. NO Consent. Just works.
// Flow: Metadata API (fetch) → exact coords → Static API (Image) → display
import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getCityImage } from '../data/locationImages';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface StreetViewProps {
  location: {
    city: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  showInfo?: boolean;
}

type Status = 'loading' | 'streetview' | 'fallback';

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [staticUrl, setStaticUrl] = useState('');
  const [heading] = useState(() => Math.floor(Math.random() * 360));
  const fallbackImage = getCityImage(location.city);

  const hasCoords = !!(location.lat && location.lng);

  useEffect(() => {
    if (!hasCoords) {
      setStatus('fallback');
      return;
    }

    const findStreetView = async () => {
      try {
        // Step 1: Metadata API — find nearest panorama
        const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location.lat},${location.lng}&source=outdoor&key=${API_KEY}`;
        const metaRes = await fetch(metaUrl);
        const meta = await metaRes.json();

        if (meta.status === 'OK' && meta.location) {
          // Step 2: Use EXACT coordinates from metadata
          const svLat = meta.location.lat;
          const svLng = meta.location.lng;
          const url = `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${svLat},${svLng}&heading=${heading}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`;
          setStaticUrl(url);
          setStatus('streetview');
          console.log('[GeoCheckr] Street View:', meta.location.description, svLat, svLng);
        } else {
          console.log('[GeoCheckr] No coverage:', location.city, meta.status);
          setStatus('fallback');
        }
      } catch (err) {
        console.warn('[GeoCheckr] Metadata error:', err);
        setStatus('fallback');
      }
    };

    findStreetView();
  }, [location.lat, location.lng]);

  if (!hasCoords) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fallback city image — always as background */}
      <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />

      {/* Static Street View — only if metadata confirmed coverage */}
      {status === 'streetview' && staticUrl && (
        <Image
          source={{ uri: staticUrl }}
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            console.warn('[GeoCheckr] Static image failed');
            setStatus('fallback');
          }}
        />
      )}

      {/* Loading */}
      {status === 'loading' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Suche Street View...</Text>
        </View>
      )}

      {showInfo && status === 'streetview' && (
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
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10,
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
