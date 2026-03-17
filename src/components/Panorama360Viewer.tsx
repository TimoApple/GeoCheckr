// GeoCheckr — 360° Panorama Viewer
// Uses Google Maps Embed API when available, falls back to direct URLs with consent handling

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getPanoramaEmbedUrl, hasApiKey } from '../config/api';

interface Panorama360ViewerProps {
  imageUrl: string;
  locationName?: string;
  lat?: number;
  lng?: number;
}

// Inject CSS and accept consent in one go
const INJECT_JS = `
(function() {
  // 1. Try to accept cookie consent
  var buttons = document.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    var text = (buttons[i].textContent || '').toLowerCase();
    if (text.includes('akzeptieren') || text.includes('accept all') || text.includes('alle akzeptieren')) {
      buttons[i].click();
      break;
    }
  }
  
  // 2. Hide Google Maps UI elements
  var style = document.createElement('style');
  style.textContent = \`
    [role="search"], .searchbox, .app-viewcard-strip, .section-layout,
    .m6QErb, .siAUzd, .bJzME, .tTVLSc, .scene-footer, .image-header,
    [aria-label="Search Google Maps"], [aria-label="Route"],
    [aria-label="Share"], [aria-label="In Google Maps suchen"],
    [aria-label="Teilen"], [aria-label="Maximieren"],
    [aria-label="Back"], [aria-label="Zurück"] {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
    }
    #mapDiv, .widget-scene, canvas {
      width: 100vw !important;
      height: 100vh !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
    }
    body, html { margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
  \`;
  document.head.appendChild(style);
  return 'done';
})();
`;

export default function Panorama360Viewer({ imageUrl, locationName, lat, lng }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const injectTimer = useRef<NodeJS.Timeout | null>(null);

  // Use API key URL if available, otherwise fall back to direct URL
  const panoramaUrl = (lat && lng && hasApiKey()) 
    ? getPanoramaEmbedUrl(lat, lng) 
    : imageUrl;

  const onLoadEnd = () => {
    // Inject JS multiple times to handle consent page redirect
    let attempts = 0;
    const inject = () => {
      if (attempts >= 6) {
        setLoading(false);
        return;
      }
      webViewRef.current?.injectJavaScript(INJECT_JS);
      attempts++;
      injectTimer.current = setTimeout(inject, 2000);
    };
    inject();
  };

  useEffect(() => {
    return () => {
      if (injectTimer.current) clearTimeout(injectTimer.current);
    };
  }, []);

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
        onLoadEnd={onLoadEnd}
        onError={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
        startInLoadingState={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
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
