// GeoCheckr Panorama Test — BIG button, full diagnostics
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, NativeModules, ScrollView } from 'react-native';

const StreetViewModule = NativeModules.StreetViewModule;

export default function App() {
  const [log, setLog] = React.useState<string[]>([
    `Platform: ${Platform.OS}`,
    `Module: ${StreetViewModule ? 'YES ✅' : 'NULL ❌'}`,
  ]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const openPanorama = () => {
    addLog('TAP registered ✅');

    if (!StreetViewModule) {
      addLog('ERROR: StreetViewModule is null');
      return;
    }

    try {
      addLog('Calling openStreetView(52.52, 13.41)...');
      StreetViewModule.openStreetView(52.52, 13.41);
      addLog('Call returned (no crash yet)');
    } catch (e: any) {
      addLog('EXCEPTION: ' + String(e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Panorama Test</Text>

      {/* FULL WIDTH BUTTON — can't miss it */}
      <TouchableOpacity
        style={styles.bigButton}
        onPress={openPanorama}
        activeOpacity={0.6}
      >
        <Text style={styles.bigButtonText}>📍 STREET VIEW ÖFFNEN</Text>
        <Text style={styles.bigButtonSub}>Berlin 52.52, 13.41</Text>
      </TouchableOpacity>

      {/* LOG */}
      <ScrollView style={styles.logBox}>
        {log.map((l, i) => (
          <Text key={i} style={styles.logLine}>{l}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  bigButton: {
    backgroundColor: '#e94560',
    borderRadius: 16,
    padding: 30,
    marginBottom: 30,
    alignItems: 'center',
    elevation: 8,
  },
  bigButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  bigButtonSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 6,
  },
  logBox: {
    flex: 1,
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 16,
  },
  logLine: {
    color: '#4ade80',
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
});
// build trigger
