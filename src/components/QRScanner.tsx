import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container}><Text style={styles.text}>Lade Kamera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera-Berechtigung benötigt</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Berechtigung erteilen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Schließen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // Extract location ID from QR code
    const locationId = data.replace('QR', '').replace('GEO-', '');
    onScan(locationId);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <Text style={styles.scanText}>QR-Code im Rahmen platzieren</Text>
          </View>
        </View>
      </CameraView>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕ Schließen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16, marginBottom: 20 },
  camera: { flex: 1, width: '100%' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanArea: { width: 250, height: 250, borderWidth: 2, borderColor: '#e94560', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  scanText: { color: '#fff', fontSize: 14, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 5 },
  button: { backgroundColor: '#e94560', padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16 },
  closeButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 20 },
  closeButtonText: { color: '#fff', fontSize: 16 },
});
