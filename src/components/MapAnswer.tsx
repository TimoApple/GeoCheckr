// GeoCheckr — Map Answer (Leaflet in WebView for clicking)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
*{margin:0;padding:0}html,body,#map{width:100%;height:100%}
#info{position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;
padding:8px 16px;border-radius:20px;font-family:sans-serif;font-size:14px;z-index:999;pointer-events:none}
.leaflet-control-zoom a{background:#16213e!important;color:#fff!important;border-color:#333!important}
</style>
</head>
<body>
<div id="map"></div>
<div id="info">Tippe auf die Karte wo du denkst</div>
<script>
var map = L.map('map',{zoomControl:true,attributionControl:false}).setView([20,0],2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(map);
var marker=null;
map.on('click',function(e){
  if(marker) map.removeLayer(marker);
  marker=L.marker(e.latlng,{draggable:true}).addTo(map);
  marker.bindPopup(e.latlng.lat.toFixed(4)+', '+e.latlng.lng.toFixed(4)).openPopup();
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng}));
});
</script>
</body>
</html>`;

interface Props {
  onPick: (lat: number, lng: number) => void;
  onClose: () => void;
}

export default function MapAnswer({ onPick, onClose }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Zeige auf die Karte</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      <WebView
        source={{ html: HTML }}
        style={styles.map}
        javaScriptEnabled={true}
        onMessage={(e) => {
          try {
            const { lat, lng } = JSON.parse(e.nativeEvent.data);
            onPick(lat, lng);
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e94560', justifyContent: 'center', alignItems: 'center' },
  closeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  map: { flex: 1 },
});
