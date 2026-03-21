// GeoCheckr — Street View v6
// Simple: Fullscreen WebView with Maps JavaScript API
// Exactly like the HTML test page that WORKS
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
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

function getStreetViewHtml(lat: number, lng: number, apiKey: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#pano{width:100%;height:100%;overflow:hidden;background:#0a0a14}
#loading{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#8888aa;text-align:center;font-family:-apple-system,sans-serif;font-size:14px;z-index:10}
#loading .emoji{font-size:32px;margin-bottom:12px}
#debug{position:fixed;bottom:8px;left:8px;color:#444;font-size:10px;font-family:monospace;z-index:20}
</style>
</head>
<body>
<div id="pano"></div>
<div id="loading"><div class="emoji">🔍</div><div>Suche Street View...</div></div>
<div id="debug">init</div>

<script>
var INIT_LAT=${lat};
var INIT_LNG=${lng};
var HEADING=Math.floor(Math.random()*360);

function init(){
  var debug=document.getElementById('debug');
  debug.innerText='API loaded';
  
  var sv=new google.maps.StreetViewService();
  
  // Step 1: Find nearest panorama (like GeoGuessr)
  sv.getPanorama({
    location:{lat:INIT_LAT,lng:INIT_LNG},
    radius:50000,
    preference:google.maps.StreetViewPreference.NEAREST,
    source:google.maps.StreetViewSource.OUTDOOR
  },function(data,status){
    if(status===google.maps.StreetViewStatus.OK){
      debug.innerText='Found: '+(data.location.description||'ok');
      document.getElementById('loading').style.display='none';
      
      // Step 2: Display panorama
      var pano=new google.maps.StreetViewPanorama(document.getElementById('pano'),{
        pano:data.location.pano,
        pov:{heading:HEADING,pitch:0},
        zoom:1,
        addressControl:false,
        showRoadLabels:false,
        linksControl:true,
        panControl:false,
        zoomControl:true,
        fullscreenControl:false,
        motionTracking:false,
        motionTrackingControl:false,
        enableCloseButton:false,
        scrollwheel:true,
        clickToGo:true
      });
      
      // Notify React Native
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'loaded',
        city:data.location.description||'',
        lat:data.location.latLng.lat(),
        lng:data.location.latLng.lng()
      }));
    }else{
      debug.innerText='NOT FOUND: '+status;
      document.getElementById('loading').innerHTML='<div class="emoji">📷</div><div>Kein Street View</div>';
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'not_found'}));
    }
  });
}

window.gm_authFailure=function(){
  document.getElementById('loading').innerHTML='<div class="emoji" style="color:#ff3333">⚠️</div><div style="color:#ff3333">API Key Fehler</div>';
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'auth_error'}));
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=init"></script>
</body></html>`;
}

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  if (!location.lat || !location.lng) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
        </View>
      </View>
    );
  }

  const html = getStreetViewHtml(location.lat, location.lng, API_KEY);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'loaded') {
        setLoading(false);
        console.log('Street View loaded:', data.city);
      } else if (data.type === 'not_found' || data.type === 'auth_error') {
        setLoading(false);
        setError(true);
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
          setError(true);
        }}
        onHttpError={(e) => {
          console.warn('WebView HTTP error:', e.nativeEvent);
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>Lade Street View...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>📷</Text>
          <Text style={styles.errorText}>{location.city}</Text>
          <Text style={styles.errorHint}>Street View nicht verfügbar</Text>
        </View>
      )}

      {showInfo && !loading && !error && (
        <View style={styles.infoOverlay}>
          <Text style={styles.infoText}>{location.city}, {location.country}</Text>
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
  loadingText: { color: '#8888aa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14', zIndex: 10,
  },
  errorContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  errorHint: { color: '#8888aa', fontSize: 14, marginTop: 8 },
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
