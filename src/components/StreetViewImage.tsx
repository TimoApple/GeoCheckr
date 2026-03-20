// GeoCheckr — Street View Image
// Approach 1: Maps Embed API (sauber, kein Consent nötig)
// Approach 2: Direct URL Fallback (mit JS Hack)
import React, { useState, useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getCityImage } from '../data/locationImages';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface StreetViewProps {
  location: {
    city: string;
    country?: string;
    region?: string;
    continent?: string;
    lat?: number;
    lng?: number;
  };
  showInfo?: boolean;
}

// --- MODE 1: Maps Embed API (saubere Lösung) ---
function getEmbedUrl(lat: number, lng: number): string {
  const heading = Math.floor(Math.random() * 360); // Random heading für Abwechslung
  return `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${lat},${lng}&heading=${heading}&pitch=0&fov=90`;
}

// --- MODE 2: Direkte Maps URL (Fallback, braucht Consent-Hack) ---
function getDirectUrl(lat: number, lng: number): string {
  const heading = Math.floor(Math.random() * 360);
  return `https://www.google.com/maps/@${lat},${lng},3a,75y,${heading}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
}

// Injected JS für Embed API - minimiert, nur Fullscreen
const EMBED_JS = `
  (function() {
    setTimeout(function() {
      var css = document.createElement('style');
      css.innerHTML = 'html,body{margin:0;padding:0;overflow:hidden;width:100vw;height:100vh;}';
      document.head.appendChild(css);
    }, 500);
    true;
  })();
`;

// Injected JS für Direkt-URL - Consent + UI entfernen
const DIRECT_JS = `
  (function() {
    // Consent Button klicken
    var clickConsent = function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').toLowerCase();
        if (t.includes('akzeptieren') || t.includes('accept') || t.includes('agree') || t.includes('zustimmen')) {
          btns[i].click();
          return true;
        }
      }
      // Auch über aria-label suchen
      var btns2 = document.querySelectorAll('[aria-label*="Accept"], [aria-label*="akzeptieren"], [aria-label*="Zustimmen"]');
      for (var j = 0; j < btns2.length; j++) { btns2[j].click(); return true; }
      return false;
    };
    clickConsent();
    setTimeout(clickConsent, 1500);
    setTimeout(clickConsent, 3000);
    // UI ausblenden + Fullscreen Canvas
    setTimeout(function() {
      var css = document.createElement('style');
      css.innerHTML = \`
        .searchbox,[role="search"],.app-viewcard-strip,
        .m6QErb,.AXQEMb,.MkVHsf,.OnJrrd,
        .l2IBqe,.SHuqSb,#omnibox-container,
        .Q2vNVc,.scene-footer,.widget-scene-control,
        .app-viewcard-strip,.widget-minimap,
        .scene-footer-container,
        [data-tooltip*="Such"],
        [data-tooltip*="Search"]
        { display:none!important; }
        canvas,.widget-scene,.scene-view
        { position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:9999!important; }
      \`;
      document.head.appendChild(css);
    }, 4000);
    true;
  })();
`;

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const webViewRef = useRef<WebView>(null);

  const hasCoords = !!(location.lat && location.lng);
  const embedUrl = hasCoords ? getEmbedUrl(location.lat!, location.lng!) : '';
  const directUrl = hasCoords ? getDirectUrl(location.lat!, location.lng!) : '';
  const imageUrl = getCityImage(location.city);

  const useEmbed = !!API_KEY;

  const handleRefresh = () => {
    setLoading(true);
    setWebViewKey(k => k + 1);
  };

  if (!hasCoords) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>{location.region} • {location.continent}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background fallback image */}
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />

      {/* Street View WebView */}
      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={{ uri: useEmbed ? embedUrl : directUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        injectedJavaScript={useEmbed ? EMBED_JS : DIRECT_JS}
        onLoadEnd={() => {
          console.log('StreetView loaded:', useEmbed ? 'embed' : 'direct');
          setLoading(false);
        }}
        onError={(e) => {
          console.warn('StreetView error:', e.nativeEvent);
          setLoading(false);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff3333" />
            <Text style={styles.loadingText}>Lade Street View...</Text>
          </View>
        )}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Text style={styles.buttonText}>🔄</Text>
      </TouchableOpacity>

      {showInfo && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoText}>{location.city}, {location.country}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  image: { width: '100%', height: '100%' },
  webview: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000', zIndex: 10,
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#888', fontSize: 14, marginTop: 8 },
  refreshButton: {
    position: 'absolute', top: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 20,
  },
  buttonText: { fontSize: 20 },
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
