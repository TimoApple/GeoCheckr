// GeoCheckr — Minimal App
// JUST shows Google Street View. Nothing else.
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';

const LOCATIONS = [
  { name: '🗼 Paris', lat: 48.8584, lng: 2.2945 },
  { name: '🗾 Tokyo', lat: 35.6595, lng: 139.7004 },
  { name: '🇩🇪 Berlin', lat: 52.52, lng: 13.405 },
  { name: '🏛 Rom', lat: 41.8900, lng: 12.4920 },
  { name: '🦘 Sydney', lat: -33.8568, lng: 151.2154 },
  { name: '🗽 New York', lat: 40.7580, lng: -73.9855 },
  { name: '🌉 San Francisco', lat: 37.8198, lng: -122.4785 },
  { name: '🏰 London', lat: 51.5007, lng: -0.1246 },
  { name: '⛪ Barcelona', lat: 41.4036, lng: 2.1744 },
  { name: '🏜 Dubai', lat: 25.1972, lng: 55.2744 },
];

function getHtml(lat, lng, apiKey) {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#pano{width:100%;height:100%;overflow:hidden;background:#0a0a14}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#888;text-align:center;font-family:sans-serif}
#status .emoji{font-size:48px;margin-bottom:16px}
#status.hide{display:none}
</style>
</head>
<body>
<div id="pano"></div>
<div id="status"><div class="emoji">🔍</div><div>Lade Street View...</div></div>
<script>
function init(){
  var sv=new google.maps.StreetViewService();
  sv.getPanorama({location:{lat:${lat},lng:${lng}},radius:50000,preference:google.maps.StreetViewPreference.NEAREST,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){
    if(s===google.maps.StreetViewStatus.OK){
      document.getElementById('status').className='hide';
      new google.maps.StreetViewPanorama(document.getElementById('pano'),{
        pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:1,
        addressControl:false,showRoadLabels:false,linksControl:true,
        panControl:false,zoomControl:true,fullscreenControl:false,
        motionTracking:false,motionTrackingControl:false,
        enableCloseButton:false,scrollwheel:true,clickToGo:true
      });
    }else{
      document.getElementById('status').innerHTML='<div class="emoji">📷</div><div>Kein Street View hier</div>';
    }
  });
}
window.gm_authFailure=function(){
  document.getElementById('status').innerHTML='<div class="emoji" style="color:red">⚠️</div><div>API Key Fehler</div>';
};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=init"></script>
</body></html>`;
}

export default function App() {
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Street View — fullscreen */}
      <WebView
        ref={webViewRef}
        key={location.name}
        source={{ html: getHtml(location.lat, location.lng, API_KEY) }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        userAgent="Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        onLoadEnd={() => setLoading(false)}
        onError={(e) => console.warn('WebView error:', e.nativeEvent)}
      />

      {/* Location selector — bottom */}
      <View style={styles.selector}>
        {LOCATIONS.map((loc) => (
          <TouchableOpacity
            key={loc.name}
            style={[styles.btn, location.name === loc.name && styles.btnActive]}
            onPress={() => { setLoading(true); setLocation(loc); }}
          >
            <Text style={styles.btnText}>{loc.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#ff3333" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
  webview: { flex: 1 },
  selector: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 8, gap: 6, justifyContent: 'center',
  },
  btn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, backgroundColor: '#1a1a2e',
    borderWidth: 1, borderColor: '#333',
  },
  btnActive: { borderColor: '#ff3333', backgroundColor: '#2a1a1a' },
  btnText: { color: '#fff', fontSize: 13 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#0a0a14',
  },
});
