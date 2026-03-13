import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GeoCheckr</Text>
      <Text style={styles.subtitle}>Finde den Ort. Gewinne das Spiel.</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Setup')}>
        <Text style={styles.buttonText}>Neues Spiel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.buttonSecondary]}>
        <Text style={styles.buttonText}>Anleitung</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e', padding: 20 },
  title: { fontSize: 48, fontWeight: 'bold', color: '#e94560', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#eee', marginBottom: 40, textAlign: 'center' },
  button: { backgroundColor: '#e94560', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 10, marginBottom: 15, width: '80%', alignItems: 'center' },
  buttonSecondary: { backgroundColor: '#0f3460' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
