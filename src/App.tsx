// GeoCheckr Debug Mode — Full Screen Street View Only
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import DebugStreetView from './screens/DebugStreetView';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <DebugStreetView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});
