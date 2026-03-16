// GeoCheckr — 360° Panorama Viewer
// Loads Google Maps panorama, auto-accepts consent, hides UI

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface Panorama360ViewerProps {
  imageUrl: string;
  locationName?: string;
}

// Auto-accept Google cookie consent
const ACCEPT_CONSENT_JS = `
(function() {
  var buttons = document.querySelectorAll('button');
  for (var i = 0; i < buttons.length; i++) {
    var text = buttons[i].textContent || '';
    if (text.includes('akzeptieren') || text.includes('Accept') || text.includes('Alle akzeptieren')) {
      buttons[i].click();
      return 'accepted';
    }
  }
  return 'no consent';
})();
`;

// Hide Google Maps UI to show only panorama
const HIDE_UI_CSS = `
(function() {
  var style = document.createElement('style');
  style.textContent = \`
    /* Hide search bar, buttons, info panel */
    [role="search"], 
    .searchbox,
    .app-viewcard-strip,
    .section-layout,
    .section-result,
    .fontDisplayLarge,
    .m6QErb,
    .P底,
    .ecPgSb,
    .DxyBCb,
    .k7OAlf,
    .siAUzd,
    .VfPpkd-WsjYwc,
    .MHUqYd,
    [data-value="Share"],
    [aria-label="Route"],
    [aria-label="Share"],
    [aria-label="Search"],
    [aria-label="In Google Maps suchen"],
    [aria-label="Teilen"],
    [aria-label="Maximieren"],
    .bJzME,
    .tTVLSc,
    .widget-scene,
    .scene-footer,
    .image-header,
    #photo-container > div:not(#mapDiv):not(.widget-scene) {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    /* Make map/fullscreen */
    #mapDiv, .widget-scene, canvas {
      width: 100vw !important;
      height: 100vh !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 1 !important;
    }
    body, html {
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
    }
  \`;
  document.head.appendChild(style);
  return 'ui hidden';
})();
`;

export default function Panorama360Viewer({ imageUrl, locationName }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const [step, setStep] = useState<'consent' | 'loaded'>('consent');

  const handleLoad = () => {
    if (step === 'consent') {
      // First: accept cookies
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(ACCEPT_CONSENT_JS);
        // After consent, wait for redirect to panorama
        setTimeout(() => {
          // Hide UI elements
          webViewRef.current?.injectJavaScript(HIDE_UI_CSS);
          setLoading(false);
          setStep('loaded');
        }, 4000);
      }, 1500);
    } else {
      // Already consented, just hide UI
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(HIDE_UI_CSS);
        setLoading(false);
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8343ff" />
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
        onLoadEnd={handleLoad}
        onError={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
        startInLoadingState={true}
        sharedCookiesEnabled={true}
        mixedContentMode="always"
        userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
