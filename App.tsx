// GeoCheckr Panorama Test — crash-proof mit Diagnostics
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, NativeModules } from 'react-native';

const TAG = '[GeoCheckr Test]';

// Debug: list all available native modules
const allModules = Object.keys(NativeModules);
console.log(TAG, 'All native modules:', allModules);

const StreetViewModule = NativeModules.StreetViewModule;
console.log(TAG, 'StreetViewModule:', StreetViewModule ? 'FOUND' : 'NULL');

export default function App() {
  const [log, setLog] = React.useState<string[]>([
    `Platform: ${Platform.OS}`,
    `StreetViewModule: ${StreetViewModule ? 'FOUND' : 'NULL'}`,
    `Available modules: ${allModules.join(', ')}`,
  ]);

  const addLog = (msg: string) => {
    console.log(TAG, msg);
    setLog(prev => [...prev, msg]);
  };

  const openPanorama = () => {
    addLog('Button tapped');

    if (Platform.OS !== 'android') {
      addLog('ERROR: Not Android');
      return;
    }

    if (!StreetViewModule) {
      addLog('ERROR: StreetViewModule is NULL!');
      addLog('Module not registered in native code');
      return;
    }

    addLog('Calling openStreetView(50.49, 30.54)...');

    try {
      StreetViewModule.openStreetView(50.49, 30.54);
      addLog('Call succeeded!');
    } catch (e: any) {
      addLog('CRASH: ' + (e?.message || String(e)));
      addLog('Stack: ' + (e?.stack || 'no stack'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panorama Test</Text>
      <Text style={styles.subtitle}>Tap button, watch log below</Text>

      <TouchableOpacity style={styles.button} onPress={openPanorama}>
        <Text style={styles.buttonText}>📍 Öffnen (Kyiv)</Text>
      </TouchableOpacity>

      <View style={styles.logBox}>
        {log.map((l, i) => (
          <Text key={i} style={styles.logLine}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  button: { backgroundColor: '#e94560', borderRadius: 12, padding: 18, paddingHorizontal: 40, marginBottom: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  logBox: { backgroundColor: '#0f0f23', borderRadius: 10, padding: 15, width: '100%', maxHeight: 300 },
  logLine: { color: '#4ade80', fontSize: 11, fontFamily: 'monospace', marginBottom: 4 },
});
