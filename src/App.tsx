// GeoCheckr — Debug Mode: Street View Navigation Test
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import StreetViewDebug from './components/StreetViewDebug';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <StreetViewDebug />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
