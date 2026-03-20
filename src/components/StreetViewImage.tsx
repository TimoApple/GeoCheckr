// GeoCheckr — Street View Image v3
// STRATEGY: Static API for guaranteed image, WebView optional for panorama
// No consent needed, no UI clutter, just a clean street view image
import React, { useState, useRef, useEffect } from 'react';
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
  mode?: 'image' | 'panorama' | 'auto'; // auto = image first, then panorama
}

// --- STATIC API: Returns a JPEG image, no consent/UI needed ---
function getStaticUrl(lat: number, lng: number, heading?: number, size: number = 640): string {
  const h = heading !== undefined ? heading : Math.floor(Math.random() * 360);
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}x${size}&location=${lat},${lng}&heading=${h}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`;
}

// --- EMBED API: Interactive panorama in iframe ---
function getEmbedUrl(lat: number, lng: number, heading?: number): string {
  const h = heading !== undefined ? heading : Math.floor(Math.random() * 360);
  return `https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${lat},${lng}&heading=${h}&pitch=0&fov=90`;
}

// --- DIRECT URL: Full interactive panorama (needs consent hack) ---
function getDirectUrl(lat: number, lng: number, heading?: number): string {
  const h = heading !== undefined ? heading : Math.floor(Math.random() * 360);
  return `https://www.google.com/maps/@${lat},${lng},3a,75y,${h}h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
}

// Minimal JS for Embed API — just fullscreen
const EMBED_JS = `
  (function() {
    var css = document.createElement('style');
    css.innerHTML = 'html,body{margin:0;padding:0;overflow:hidden;width:100vw;height:100vh}';
    document.head.appendChild(css);
    true;
  })();
`;

// Aggressive consent hack + UI removal for direct URL
const DIRECT_JS = `
  (function() {
    var clickConsent = function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').toLowerCase();
        if (t.includes('akzeptieren') || t.includes('accept') || t.includes('agree') || t.includes('zustimmen')) {
          btns[i].click(); return true;
        }
      }
      var btns2 = document.querySelectorAll('[aria-label*="Accept"], [aria-label*="akzeptieren"], [aria-label*="Zustimmen"]');
      for (var j = 0; j < btns2.length; j++) { btns2[j].click(); return true; }
      return false;
    };
    clickConsent();
    setTimeout(clickConsent, 1500);
    setTimeout(clickConsent, 3000);
    setTimeout(function() {
      var css = document.createElement('style');
      css.innerHTML = \`
        .searchbox,[role="search"],.app-viewcard-strip,.m6QErb,.AXQEMb,
        .MkVHsf,.OnJrrd,.l2IBqe,.SHuqSb,#omnibox-container,
        .Q2vNVc,.scene-footer,.widget-scene-control,
        .app-viewcard-strip,.widget-minimap,.scene-footer-container,
        [data-tooltip*="Such"],[data-tooltip*="Search"]
        { display:none!important; }
        canvas,.widget-scene,.scene-view
        { position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:9999!important; }
      \`;
      document.head.appendChild(css);
    }, 4000);
    true;
  })();
`;

export default function StreetViewImage({ location, showInfo = false, mode = 'auto' }: StreetViewProps) {
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [staticError, setStaticError] = useState(false);
  const [panoramaLoaded, setPanoramaLoaded] = useState(false);
  const [heading] = useState(() => Math.floor(Math.random() * 360));
  const webViewRef = useRef<WebView>(null);

  const hasCoords = !!(location.lat && location.lng);
  const staticUrl = hasCoords ? getStaticUrl(location.lat!, location.lng!, heading) : '';
  const embedUrl = hasCoords ? getEmbedUrl(location.lat!, location.lng!, heading) : '';
  const directUrl = hasCoords ? getDirectUrl(location.lat!, location.lng!, heading) : '';
  const fallbackImage = getCityImage(location.city);

  // Determine what to show
  const useStatic = hasCoords && API_KEY && (mode === 'image' || mode === 'auto');
  const usePanorama = hasCoords && API_KEY && mode === 'panorama';
  const showStatic = useStatic && !panoramaLoaded;

  // Pre-load static image
  useEffect(() => {
    if (!useStatic || !staticUrl) return;
    Image.prefetch(staticUrl)
      .then(() => { setStaticLoaded(true); })
      .catch(() => { setStaticError(true); });
  }, [staticUrl]);

  if (!hasCoords) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />
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
      {/* Background fallback — always show */}
      <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />

      {/* Static Street View Image — guaranteed, no consent */}
      {showStatic && staticUrl && (
        <Image
          source={{ uri: staticUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoad={() => setStaticLoaded(true)}
          onError={() => { setStaticError(true); console.warn('Static API failed'); }}
        />
      )}

      {/* Panorama WebView — optional overlay */}
      {usePanorama && (
        <WebView
          ref={webViewRef}
          source={{ uri: embedUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          userAgent="Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
          injectedJavaScript={EMBED_JS}
          onLoadEnd={() => {
            console.log('Panorama loaded');
            setPanoramaLoaded(true);
          }}
          onError={(e) => {
            console.warn('Panorama error:', e.nativeEvent);
          }}
        />
      )}

      {/* Loading spinner — only while waiting */}
      {!staticLoaded && !staticError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}

      {/* Error state */}
      {staticError && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>📷</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>Street View nicht verfügbar</Text>
        </View>
      )}

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
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
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
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
