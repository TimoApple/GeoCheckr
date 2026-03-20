// GeoCheckr — Interactive Street View Panorama v1
// Uses Maps JavaScript API in WebView for full 360° panorama
// Like GeoGuessr! Players can look around, zoom, etc.
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface PanoramaViewProps {
  location: {
    city: string;
    lat?: number;
    lng?: number;
  };
  onLoad?: () => void;
  onError?: (error: string) => void;
}

function getPanoramaHtml(lat: number, lng: number, apiKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>GeoCheckr</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #pano { width: 100%; height: 100%; overflow: hidden; background: #0a0a14; }
#pano { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
#loading {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  color: #888; font-family: -apple-system, sans-serif; font-size: 14px;
  text-align: center;
}
#loading .dot { animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
#status { display: none; position: fixed; bottom: 10px; left: 10px; color: #444; font-size: 11px; font-family: monospace; }
</style>
</head>
<body>
<div id="pano"></div>
<div id="loading">
  <div style="font-size: 32px; margin-bottom: 12px;">🌍</div>
  <div>Lade Street View<span class="dot">.</span></div>
</div>
<div id="status"></div>

<script>
var INIT_LAT = ${lat};
var INIT_LNG = ${lng};

function initPano() {
  var statusEl = document.getElementById('status');
  statusEl.innerText = 'API loaded. Finding panorama...';

  var sv = new google.maps.StreetViewService();
  sv.getPanorama({
    location: { lat: INIT_LAT, lng: INIT_LNG },
    radius: 100,
    preference: google.maps.StreetViewPreference.NEAREST,
    source: google.maps.StreetViewSource.OUTDOOR
  }, function(data, status) {
    if (status === google.maps.StreetViewStatus.OK) {
      statusEl.innerText = 'Panorama found: ' + (data.location.description || 'unknown');

      var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), {
        position: data.location.latLng,
        pov: {
          heading: Math.random() * 360,
          pitch: 0
        },
        zoom: 1,
        // Minimal UI for GeoCheckr
        addressControl: false,
        showRoadLabels: false,
        linksControl: true,
        panControl: false,
        zoomControl: true,
        fullscreenControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        enableCloseButton: false,
        scrollwheel: true,
        clickToGo: true,
        disableDefaultUI: false,
      });

      // Remove any remaining UI elements via CSS
      var style = document.createElement('style');
      style.innerHTML = \`
        .gm-iv-address, .gm-iv-logo, .gm-iv-show-hide-button,
        .gmnoprint:not(.gm-svpc), .gm-control-active,
        [title="Report a problem"], [title="Open in Google Maps"],
        [title="Fullscreen"]
        { display: none !important; }
      \`;
      document.head.appendChild(style);

      document.getElementById('loading').style.display = 'none';
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'loaded',
        description: data.location.description || '',
        lat: data.location.latLng.lat(),
        lng: data.location.latLng.lng(),
      }));
    } else {
      statusEl.innerText = 'Error: ' + status;
      document.getElementById('loading').innerHTML =
        '<div style="font-size:32px;margin-bottom:12px;">📷</div>' +
        '<div>Street View nicht verfügbar</div>';
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'error',
        status: status
      }));
    }
  });
}

// Error handler
window.gm_authFailure = function() {
  document.getElementById('loading').innerHTML =
    '<div style="color:#ff3333;font-size:32px;margin-bottom:12px;">⚠️</div>' +
    '<div>API Key ungültig oder nicht aktiviert</div>';
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'auth_error'
  }));
};
</script>

<script async defer
  src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initPano">
</script>
</body>
</html>`;
}

export default function StreetViewPanorama({ location, onLoad, onError }: PanoramaViewProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  if (!location.lat || !location.lng) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>🌍</Text>
        <Text style={styles.errorText}>{location.city}</Text>
        <Text style={styles.errorHint}>Keine Koordinaten</Text>
      </View>
    );
  }

  const html = getPanoramaHtml(location.lat!, location.lng!, API_KEY);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded') {
        setLoading(false);
        console.log('Panorama loaded:', data.description);
        onLoad?.();
      } else if (data.type === 'error') {
        setLoading(false);
        console.warn('Panorama error:', data.status);
        onError?.(data.status);
      } else if (data.type === 'auth_error') {
        setLoading(false);
        console.error('API Key error');
        onError?.('auth_error');
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMessage}
        onError={(e) => {
          console.warn('WebView error:', e.nativeEvent);
          setLoading(false);
          onError?.('webview_error');
        }}
        onHttpError={(e) => {
          console.warn('WebView HTTP error:', e.nativeEvent);
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Lade Panorama...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14', zIndex: 10,
  },
  loadingText: { color: '#888', marginTop: 10, fontSize: 14 },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#888', fontSize: 14, marginTop: 8 },
});
