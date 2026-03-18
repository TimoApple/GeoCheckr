// GeoCheckr Panorama Test — 1 Ort, 1 Button, sonst nix
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NativeModules } from 'react-native';

const { StreetViewModule } = NativeModules;

export default function App() {
  const [status, setStatus] = React.useState('Bereit — tippe zum Öffnen');

  const openPanorama = () => {
    try {
      if (Platform.OS === 'android' && StreetViewModule) {
        StreetViewModule.openStreetView(50.49, 30.54); // Kyiv
        setStatus('Geöffnet ✓');
      } else {
        setStatus('Fehler: StreetViewModule nicht gefunden');
      }
    } catch (e: any) {
      setStatus('CRASH: ' + (e?.message || String(e)));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panorama Test</Text>
      <Text style={styles.status}>{status}</Text>
      <TouchableOpacity style={styles.button} onPress={openPanorama}>
        <Text style={styles.buttonText}>📍 Street View öffnen (Kyiv)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  status: { fontSize: 14, color: '#e94560', marginBottom: 30, textAlign: 'center' },
  button: { backgroundColor: '#16213e', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e94560' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
