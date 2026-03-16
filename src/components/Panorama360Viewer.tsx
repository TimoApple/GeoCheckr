// GeoCheckr — 360° Panorama Viewer via WebView
// Embeds Google Maps Street View panorama directly

import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Panorama360ViewerProps {
  imageUrl: string;  // Google Maps URL
  locationName?: string;
}

export default function Panorama360Viewer({ imageUrl, locationName }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Embed Google Maps directly in iframe for panorama URLs
  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { overflow:hidden; background:#282828; }
iframe { width:100vw; height:100vh; border:none; }
#loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:#aaa; font-family:sans-serif; }
</style>
</head>
<body>
<div id="loading">Lade Panorama...</div>
<iframe id="mapframe" src="https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1s!2m2!1d0!2d0!3f0!4f0!5f0" 
  allowfullscreen loading="lazy"
  onload="document.getElementById('loading').style.display='none';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded')"
  onerror="document.getElementById('loading').textContent='Panorama nicht verfügbar';window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error')">
</iframe>
<script>
// Fallback: redirect to Google Maps after timeout
setTimeout(function() {
  var frame = document.getElementById('mapframe');
  if (frame && !frame.src.includes('!1d')) {
    window.location.href = '${imageUrl}';
  }
}, 5000);
</script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8343ff" />
          <Text style={styles.loadingText}>Lade 360°...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: imageUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(e) => {
          if (e.nativeEvent.data === 'loaded' || e.nativeEvent.data === 'error') setLoading(false);
        }}
        onError={() => setLoading(false)}
        onLoadEnd={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282828', borderRadius: 15, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#282828' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#282828' },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
});
