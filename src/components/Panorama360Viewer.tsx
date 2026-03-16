// GeoCheckr — 360° Panorama Viewer
// Opens Google Maps panorama URL directly in WebView (fullscreen)

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Panorama360ViewerProps {
  imageUrl: string;
  locationName?: string;
}

export default function Panorama360Viewer({ imageUrl, locationName }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8343ff" />
        </View>
      )}
      <WebView
        source={{ uri: imageUrl }}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
