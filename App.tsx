// GeoCheckr Panorama Test — NUR Fullscreen Street View öffnen
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

// Inline the native module (simplest possible)
import { NativeModules } from 'react-native';
const { StreetViewModule } = NativeModules;

// Test locations
const TEST_LOCATIONS = [
  { name: 'Kyiv, Ukraine', lat: 50.49, lng: 30.54 },
  { name: 'Stornoway, Scotland', lat: 58.17, lng: -6.59 },
  { name: 'Tokyo, Japan', lat: 35.68, lng: 139.77 },
  { name: 'New York, USA', lat: 40.76, lng: -73.98 },
  { name: 'Berlin, Germany', lat: 52.52, lng: 13.41 },
];

export default function App() {
  const [status, setStatus] = React.useState('Ready');
  const [error, setError] = React.useState<string | null>(null);

  const openPanorama = (lat: number, lng: number, name: string) => {
    setError(null);
    setStatus(`Opening: ${name}...`);
    
    try {
      if (Platform.OS === 'android' && StreetViewModule) {
        StreetViewModule.openStreetView(lat, lng);
        setStatus(`Opened: ${name}`);
      } else {
        setError('StreetViewModule not available (not Android or module not linked)');
        setStatus('Error');
      }
    } catch (e: any) {
      setError(`Crash: ${e?.message || e}`);
      setStatus('CRASHED');
      console.error('StreetView open failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Panorama Test</Text>
      <Text style={styles.subtitle}>Tap a location to open native Street View</Text>
      <Text style={styles.status}>Status: {status}</Text>
      
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.buttonGrid}>
        {TEST_LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc.name}
            style={styles.button}
            onPress={() => openPanorama(loc.lat, loc.lng, loc.name)}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>📍 {loc.name}</Text>
            <Text style={styles.buttonCoords}>{loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.info}>
        If tapping crashes the app, the native StreetViewActivity has an issue.
        Check logcat for: adb logcat | grep -E "GeoCheckr|AndroidRuntime"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#e94560',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonGrid: {
    gap: 12,
  },
  button: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonCoords: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  info: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 16,
  },
});
