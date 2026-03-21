// GeoCheckr — Street View Image v5 (GeoGuessr-Style)
// Uses Maps JavaScript API StreetViewService to FIND nearest panorama
// Then uses exact coordinates for Static API — guaranteed real imagery
// Workflow: getPanorama(radius=50000) → exact coords → Static API
import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
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

interface PanoramaResult {
  lat: number;
  lng: number;
  heading: number;
  description: string;
}

// Minimal HTML that uses StreetViewService.getPanorama() to find nearest panorama
// This is EXACTLY how GeoGuessr works — find panorama first, then display
function getFinderHtml(lat: number, lng: number, apiKey: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0}body{background:#0a0a14;width:100vw;height:100vh;overflow:hidden}</style>
</head><body>
<script>
var INIT_LAT=${lat};
var INIT_LNG=${lng};
var HEADING=Math.floor(Math.random()*360);
function init(){
  var sv=new google.maps.StreetViewService();
  sv.getPanorama({
    location:{lat:INIT_LAT,lng:INIT_LNG},
    radius:50000,
    preference:google.maps.StreetViewPreference.NEAREST,
    source:google.maps.StreetViewSource.OUTDOOR
  },function(data,status){
    if(status===google.maps.StreetViewStatus.OK){
      var loc=data.location.latLng;
      // Send EXACT coordinates back to React Native
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:'found',
        lat:loc.lat(),
        lng:loc.lng(),
        heading:HEADING,
        description:data.location.description||''
      }));
    }else{
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'not_found'}));
    }
  });
}
window.gm_authFailure=function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'auth_error'}));
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=init"></script>
</body></html>`;
}

function getStaticUrl(lat: number, lng: number, heading: number): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=640x640&location=${lat},${lng}&heading=${heading}&pitch=0&fov=90&source=outdoor&key=${API_KEY}`;
}

type Status = 'finding' | 'loading' | 'loaded' | 'fallback';

export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [status, setStatus] = useState<Status>('finding');
  const [staticUrl, setStaticUrl] = useState('');
  const [staticLoaded, setStaticLoaded] = useState(false);
  const [heading] = useState(() => Math.floor(Math.random() * 360));
  const fallbackImage = getCityImage(location.city);

  const hasCoords = !!(location.lat && location.lng);

  // If no coords, show fallback immediately
  if (!hasCoords) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>{location.city}</Text>
        </View>
      </View>
    );
  }

  const finderHtml = getFinderHtml(location.lat!, location.lng!, API_KEY);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'found') {
        // Got exact panorama coordinates! Use them for Static API
        const url = getStaticUrl(data.lat, data.lng, data.heading);
        setStaticUrl(url);
        setStatus('loading');
      } else {
        // No panorama found even with 50km radius
        setStatus('fallback');
      }
    } catch {
      setStatus('fallback');
    }
  };

  return (
    <View style={styles.container}>
      {/* Fallback city image — always as background */}
      <Image source={{ uri: fallbackImage }} style={styles.image} resizeMode="cover" />

      {/* Static image — only after panorama coords confirmed */}
      {staticUrl && (
        <Image
          source={{ uri: staticUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoad={() => {
            setStaticLoaded(true);
            setStatus('loaded');
          }}
          onError={() => setStatus('fallback')}
        />
      )}

      {/* Hidden WebView — only for finding nearest panorama */}
      {status === 'finding' && (
        <WebView
          source={{ html: finderHtml }}
          style={{ width: 1, height: 1, position: 'absolute', opacity: 0 }}
          javaScriptEnabled={true}
          onMessage={handleMessage}
          onError={() => setStatus('fallback')}
        />
      )}

      {/* Loading spinner */}
      {(status === 'finding' || status === 'loading') && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ff3333" />
          <Text style={styles.loadingText}>
            {status === 'finding' ? 'Suche Street View...' : 'Lade Bild...'}
          </Text>
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10,
  },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
  errorEmoji: { fontSize: 60, marginBottom: 15 },
  errorText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  infoOverlay: {
    position: 'absolute', bottom: 20, left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    zIndex: 20,
  },
  infoText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
