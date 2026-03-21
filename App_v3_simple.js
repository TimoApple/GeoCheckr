// GeoCheckr v3 — Minimal Test (Native Module Only)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, NativeModules, Platform, ScrollView } from 'react-native';

const LOCATIONS = [
  { id:1, city:'Seoul', country:'Südkorea', lat:37.5665, lng:126.9780 },
  { id:2, city:'Tokyo', country:'Japan', lat:35.6762, lng:139.6503 },
  { id:3, city:'New York', country:'USA', lat:40.7128, lng:-74.0060 },
  { id:4, city:'Portland', country:'USA', lat:45.5152, lng:-122.6784 },
  { id:5, city:'Delhi', country:'Indien', lat:28.6139, lng:77.2090 },
  { id:6, city:'Johannesburg', country:'Südafrika', lat:-26.2041, lng:28.0473 },
  { id:7, city:'Kapstadt', country:'Südafrika', lat:-33.9249, lng:18.4241 },
  { id:8, city:'Kopenhagen', country:'Dänemark', lat:55.6761, lng:12.5683 },
  { id:9, city:'Rio', country:'Brasilien', lat:-22.9068, lng:-43.1729 },
  { id:10, city:'Beijing', country:'China', lat:39.9042, lng:116.4074 },
];

export default function App() {
  const [log, setLog] = React.useState([
    `Platform: ${Platform.OS}`,
    `StreetViewModule: ${NativeModules.StreetViewModule ? 'YES ✅' : 'NULL ❌'}`,
  ]);

  const addLog = (msg) => setLog(p => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const open = (loc) => {
    addLog(`Opening: ${loc.city} (${loc.lat}, ${loc.lng})`);
    if (!NativeModules.StreetViewModule) {
      addLog('ERROR: StreetViewModule is NULL!');
      return;
    }
    try {
      NativeModules.StreetViewModule.openStreetView(loc.lat, loc.lng);
      addLog('✅ Call returned OK');
    } catch (e) {
      addLog('❌ Exception: ' + String(e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 GeoCheckr Test</Text>
      <ScrollView style={styles.locList}>
        {LOCATIONS.map(loc => (
          <TouchableOpacity key={loc.id} style={styles.locBtn} onPress={() => open(loc)}>
            <Text style={styles.locName}>📍 {loc.city}, {loc.country}</Text>
            <Text style={styles.locCoord}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.logBox}>
        {log.map((l, i) => <Text key={i} style={styles.logLine}>{l}</Text>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#1a1a2e', padding:20, paddingTop:60 },
  title: { fontSize:28, fontWeight:'bold', color:'#fff', textAlign:'center', marginBottom:16 },
  locList: { maxHeight:300, marginBottom:16 },
  locBtn: { backgroundColor:'#16213e', padding:16, borderRadius:12, marginBottom:8, borderWidth:1, borderColor:'#333' },
  locName: { color:'#fff', fontSize:16, fontWeight:'700' },
  locCoord: { color:'#888', fontSize:12, marginTop:4 },
  logBox: { flex:1, backgroundColor:'#0f0f23', borderRadius:12, padding:16 },
  logLine: { color:'#4ade80', fontSize:13, fontFamily:'monospace', marginBottom:6 },
});
