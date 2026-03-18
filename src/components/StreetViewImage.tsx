// GeoCheckr — Street View Image (inline WebView, no native module needed)
import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { getCityImage } from '../data/locationImages';

interface StreetViewProps {
  location: {
    city: string;
    country?: string;
    region?: string;
    continent?: string;
    panoramaUrl?: string;
    streetViewUrl?: string;
    lat?: number;
    lng?: number;
  };
  showInfo?: boolean;
}

// Google Maps Street View URL
function getStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
}

// JS to hide Google UI and accept cookies
const INJECTED_JS = `
  (function() {
    // Click "Alle akzeptieren" if present
    setTimeout(function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = btns[i].innerText.toLowerCase();
        if (t.includes('akzeptieren') || t.includes('accept') || t.includes('agree') || t.includes('zustimmen')) {
          btns[i].click();
          break;
        }
      }
    }, 2000);
    // Hide search bar and UI elements
    setTimeout(function() {
      var css = document.createElement('style');
      css.innerHTML = \`
        .searchbox, [role="search"], .app-viewcard-strip,
        .m6QErb, .AXQEMb, .MkVHsf, .OnJrrd,
        [data-tooltip="Nach einem Ort suchen"],
        .l2IBqe, .SHuqSb,
        #omnibox-container,
        .fontBodySmall,
        .Q2vNVc,
        .scene-footer,
        .widget-scene-control,
        .app-viewcard-strip,
        .widget-minimap
      { display: none !important; }
      canvas, .widget-scene { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 9999 !important; }
    \`;
      document.head.appendChild(css);
    }, 4000);
    true;
  })();
`;

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const hasCoords = !!(location.lat && location.lng);

  // Reset when location changes
  React.useEffect(() => {
    setLoading(true);
    setError(false);
    setShowWebView(false);
    // Auto-open WebView after short delay
    if (location.lat && location.lng) {
      const timer = setTimeout(() => {
        setShowWebView(true);
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const imageUrl = getCityImage(location.city);
  const streetViewUrl = hasCoords ? getStreetViewUrl(location.lat!, location.lng!) : '';

  return (
    <View style={styles.container}>
      {/* Background city image (always visible behind WebView) */}
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        onLoad={() => { if (!showWebView) setLoading(false); }}
        onError={() => { if (!showWebView) { setError(true); setLoading(false); } }}
        resizeMode="cover"
      />

      {/* Inline Street View WebView */}
      {showWebView && hasCoords && (
        <WebView
          ref={webViewRef}
          source={{ uri: streetViewUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
          injectedJavaScript={INJECTED_JS}
          onLoadEnd={() => {
            console.log('WebView loaded:', streetViewUrl);
            setLoading(false);
          }}
          onError={(syntheticEvent) => {
            console.warn('WebView error:', syntheticEvent.nativeEvent);
            setError(true);
            setLoading(false);
          }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#e94560" />
              <Text style={styles.loadingText}>Lade Street View...</Text>
            </View>
          )}
        />
      )}

      {/* Loading overlay */}
      {loading && !showWebView && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}

      {/* Error overlay */}
      {error && !showWebView && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>{location.region} • {location.continent}</Text>
        </View>
      )}

      {/* Toggle button */}
      {hasCoords && (
        <TouchableOpacity
          style={styles.streetViewButton}
          onPress={() => setShowWebView(!showWebView)}
        >
          <Text style={styles.streetViewButtonText}>
            {showWebView ? '🖼️ Bild' : '🌐 Street View'}
          </Text>
        </TouchableOpacity>
      )}

      {showInfo && !error && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoText}>{location.city}, {location.country}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', position: 'relative' },
  image: { width: '100%', height: '100%' },
  webview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    zIndex: 5,
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#888', fontSize: 14, marginTop: 8 },
  streetViewButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#e94560',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 20,
  },
  streetViewButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  infoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
