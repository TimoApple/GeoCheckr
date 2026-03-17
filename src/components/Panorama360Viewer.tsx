// GeoCheckr — 360° Panorama Viewer
// Uses Google Maps Embed API (designed for WebView, no consent needed)

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getPanoramaEmbedUrl } from '../config/api';

interface Panorama360ViewerProps {
  imageUrl: string;
  locationName?: string;
  lat?: number;
  lng?: number;
}

export default function Panorama360Viewer({ imageUrl, locationName, lat, lng }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Use Maps Embed API when we have coordinates, otherwise fall back to provided URL
  const panoramaUrl = (lat && lng) 
    ? getPanoramaEmbedUrl(lat, lng) 
    : imageUrl;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8343ff" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: panoramaUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
        startInLoadingState={true}
        mixedContentMode="always"
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});
