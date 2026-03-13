import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SetupScreen({ route }: any) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Spieler</Text>
      <Text style={styles.playerInfo}>2-8 Spieler</Text>
      
      <Text style={styles.sectionTitle}>Schwierigkeit</Text>
      <View style={styles.diffRow}>
        <View style={[styles.diffButton, styles.diffActive]}>
          <Text style={styles.diffTextActive}>Leicht</Text>
        </View>
        <View style={styles.diffButton}>
          <Text style={styles.diffText}>Mittel</Text>
        </View>
        <View style={styles.diffButton}>
          <Text style={styles.diffText}>Schwer</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Ziel: 10 Karten</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', padding: 20 },
  sectionTitle: { color: '#e94560', fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  playerInfo: { color: '#fff', fontSize: 16 },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between' },
  diffButton: { flex: 1, backgroundColor: '#16213e', padding: 15, borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  diffActive: { backgroundColor: '#e94560' },
  diffText: { color: '#666', fontSize: 14 },
  diffTextActive: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
