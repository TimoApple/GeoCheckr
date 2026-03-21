// GeoCheckr — Street View v9
// EXACT same HTML that worked in Chrome, embedded in WebView
// + Google CONSENT cookie injected to bypass consent screen
import React, { useState, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getCityImage } from '../data/locationImages';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

interface StreetViewProps {
  location: {
    city: string;
    country?: string;
    lat?: number;
    lng?: number;
  };
  showInfo?: boolean;
}

function getHtml(lat: number, lng: number, apiKey: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#pano{width:100%;height:100%;overflow:hidden;background:#0a0a14}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;text-align:center;font-family:sans-serif;font-size:14px;z-index:10}
#status .emoji{font-size:48px;margin-bottom:16px}
#status.hide{display:none}
</style>
</head>
<body>
<div id="pano"></div>
<div id="status"><div class="emoji">🔍</div><div>Suche Street View...</div></div>
<script>
var lat=${lat},lng=${lng},heading=Math.floor(Math.random()*360);
function init(){
  var sv=new google.maps.StreetViewService();
  sv.getPanorama({location:{lat:lat,lng:lng},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){
    if(s===google.maps.StreetViewStatus.OK){
      document.getElementById('status').className='hide';
      new google.maps.StreetViewPanorama(document.getElementById('pano'),{
        pano:d.location.pano,pov:{heading:heading,pitch:0},zoom:1,
        addressControl:false,showRoadLabels:false,linksControl:true,
        panControl:false,zoomControl:true,fullscreenControl:false,
        motionTracking:false,motionTrackingControl:false,
        enableCloseButton:false,scrollwheel:true,clickToGo:true
      });
      // Hide Google UI
      setTimeout(function(){var e=document.createElement('style');
        e.innerHTML='.gm-iv-address,.gm-iv-logo,.gm-iv-show-hide-button,.gmnoprint:not(.gm-svpc),[title="Report a problem"],[title="Open in Google Maps"]{display:none!important}';
        document.head.appendChild(e);},1000);
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');
    }else{
      document.getElementById('status').innerHTML='<div class="emoji">📷</div><div>Kein Street View</div>';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('not_found');
    }
  });
}
window.gm_authFailure=function(){
  document.getElementById('status').innerHTML='<div class="emoji" style="color:red">⚠️</div><div>API Key Fehler</div>';
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('auth_error');
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=init"></script>
</body></html>`;
}

// Inject Google CONSENT cookie to bypass consent screen in WebView
const INJECT_CONSENT = `
(function(){
  // Google consent cookie: YES+ means "all consented"
  document.cookie = "CONSENT=YES+; domain=.google.com; path=/; max-age=31536000";
  document.cookie = "CONSENT=YES+; domain=.googleapis.com; path=/; max-age=31536000";
  document.cookie = "CONSENT=YES+; domain=.google.com.au; path=/; max-age=31536000";
  true;
})();
`;

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const hasCoords = !!(location.lat && location.lng);
  const fallbackImage = getCityImage(location.city);

  const handleMessage = useCallback((event: any) => {
    const msg = event.nativeEvent.data;
    if (msg === 'loaded') setLoading(false);
    else if (msg === 'not_found' || msg === 'auth_error') { setLoading(false); setError(true); }
  }, []);

  if (!hasCoords) {
    return <View style={styles.container}><Image source={{uri:fallbackImage}} style={styles.image} resizeMode="cover"/></View>;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getHtml(location.lat!, location.lng!, API_KEY) }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        injectedJavaScriptBeforeContentLoaded={INJECT_CONSENT}
        userAgent="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        onMessage={handleMessage}
        onError={() => { setLoading(false); setError(true); }}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333"/>
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>📷</Text>
          <Text style={styles.errorText}>{location.city}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  webview: { flex: 1 },
  image: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14', zIndex: 10 },
  loadingText: { color: '#888', marginTop: 10, fontSize: 14 },
  errorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14', zIndex: 10 },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
});
