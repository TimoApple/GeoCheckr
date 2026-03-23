// GeoCheckr — 12 Street View Approaches for APK Debug
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const API_KEY = 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI';
const LAT = 52.52, LNG = 13.405; // Berlin

const APPROACHES = [
  {
    name: '1: Direct Maps URL',
    desc: 'Google Maps URL direkt im WebView',
    html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"></head>
<body style="margin:0;padding:0;overflow:hidden">
<iframe src="https://www.google.com/maps/@${LAT},${LNG},3a,75y,90h,90t/data=!3m6!1e1" 
style="width:100%;height:100%;border:none" allowfullscreen></iframe>
</body></html>`
  },
  {
    name: '2: Embed API',
    desc: 'Maps Embed API streetview',
    html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0">
<iframe width="100%" height="100%" frameborder="0" style="border:0"
src="https://www.google.com/maps/embed/v1/streetview?key=${API_KEY}&location=${LAT},${LNG}&heading=0&pitch=0&fov=90"
allowfullscreen></iframe>
</body></html>`
  },
  {
    name: '3: JS API Standard',
    desc: 'StreetViewPanorama mit API Key',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
function init(){
  var p = new google.maps.StreetViewPanorama(document.getElementById('pano'),{
    position:{lat:${LAT},lng:${LNG}},
    pov:{heading:Math.random()*360,pitch:0},zoom:0,
    addressControl:false,linksControl:true,panControl:true,
    zoomControl:true,fullscreenControl:false,clickToGo:true,
    scrollwheel:true,motionTracking:false,motionTrackingControl:false
  });
  if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage('loaded:'+p.getLocation()?.latLng?.lat());
}
if(google&&google.maps) init();
else window.addEventListener('load',init);
</script></body></html>`
  },
  {
    name: '4: JS API + getPanorama',
    desc: 'Erst getPanorama, dann erstellen',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}
#status{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-family:sans-serif}</style>
</head><body><div id="pano"></div><div id="status">Suche Panorama...</div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
var sv = new google.maps.StreetViewService();
sv.getPanorama({location:{lat:${LAT},lng:${LNG}},radius:50000,source:google.maps.StreetViewSource.OUTDOOR},function(d,s){
  document.getElementById('status').style.display='none';
  if(s===google.maps.StreetViewStatus.OK){
    new google.maps.StreetViewPanorama(document.getElementById('pano'),{
      pano:d.location.pano,pov:{heading:Math.random()*360,pitch:0},zoom:0,
      addressControl:false,linksControl:true,panControl:true,zoomControl:true,
      fullscreenControl:false,clickToGo:true,scrollwheel:true
    });
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage('loaded');
  } else {
    document.getElementById('status').textContent='Kein Panorama gefunden';
    if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage('error:'+s);
  }
});
</script></body></html>`
  },
  {
    name: '5: Callback Init',
    desc: 'Mit callback=initStreetView',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body><div id="pano"></div>
<script>
function initStreetView(){
  new google.maps.StreetViewPanorama(document.getElementById('pano'),{
    position:{lat:${LAT},lng:${LNG}},pov:{heading:180,pitch:0},zoom:0,
    addressControl:false,linksControl:true,panControl:true,zoomControl:true,
    fullscreenControl:false,clickToGo:true,scrollwheel:true
  });
}
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initStreetView&libraries=streetView" async defer></script>
</body></html>`
  },
  {
    name: '6: Maps Full URL',
    desc: 'Vollständige Google Maps URL im iframe',
    html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"></head>
<body style="margin:0;padding:0;overflow:hidden">
<iframe src="https://www.google.com/maps/@${LAT},${LNG},3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192"
style="width:100%;height:100%;border:none" allow="geolocation" allowfullscreen></iframe>
</body></html>`
  },
  {
    name: '7: Scroll Enabled',
    desc: 'WebView scrollEnabled + touch handling',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;background:#000}
#pano{touch-action:pan-x pan-y pinch-zoom}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
new google.maps.StreetViewPanorama(document.getElementById('pano'),{
  position:{lat:${LAT},lng:${LNG}},pov:{heading:90,pitch:0},zoom:0,
  addressControl:false,linksControl:true,panControl:true,zoomControl:true,
  fullscreenControl:false,clickToGo:true,scrollwheel:true,
  disableDefaultUI:false,motionTracking:false
});
</script></body></html>`
  },
  {
    name: '8: Chrome UA',
    desc: 'Chrome User Agent + DomStorage',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
try{
  var pano = new google.maps.StreetViewPanorama(document.getElementById('pano'),{
    position:{lat:${LAT},lng:${LNG}},pov:{heading:270,pitch:0},zoom:0,
    addressControl:false,linksControl:true,panControl:true,zoomControl:true,
    fullscreenControl:false,clickToGo:true,scrollwheel:true
  });
  document.addEventListener('touchstart',function(){},{passive:true});
  document.addEventListener('touchmove',function(e){e.stopPropagation()},{passive:false});
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('init_ok');
}catch(e){
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('error:'+e.message);
}
</script></body></html>`
  },
  {
    name: '9: Latitude Explicit',
    desc: 'LatLng explizit + radius=100000',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
var sv = new google.maps.StreetViewService();
var loc = new google.maps.LatLng(${LAT},${LNG});
sv.getPanorama({location:loc,radius:100000},function(data,status){
  if(status==='OK'){
    var pv = new google.maps.StreetViewPanorama(document.getElementById('pano'),{
      pano:data.location.pano,
      pov:{heading:0,pitch:0},zoom:0,
      addressControl:false,linksControl:true,panControl:true,zoomControl:true,
      fullscreenControl:false,clickToGo:true,scrollwheel:true
    });
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('ok:'+data.location.description);
  } else {
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('fail:'+status);
  }
});
</script></body></html>`
  },
  {
    name: '10: v=weekly',
    desc: 'Maps API v=weekly parameter',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=streetView"></script>
<script>
var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'),{
  position:{lat:${LAT},lng:${LNG}},
  pov:{heading:0,pitch:0},zoom:0,
  linksControl:true,panControl:true,zoomControl:true,
  addressControl:false,fullscreenControl:false,clickToGo:true
});
</script></body></html>`
  },
  {
    name: '11: No Overflow Hidden',
    desc: 'Body overflow visible, touch passthrough',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body{width:100%;height:100%;overflow:visible;background:#000}
#pano{width:100vw;height:100vh;touch-action:none}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
new google.maps.StreetViewPanorama(document.getElementById('pano'),{
  position:{lat:${LAT},lng:${LNG}},pov:{heading:45,pitch:0},zoom:0,
  addressControl:false,linksControl:true,panControl:true,zoomControl:true,
  fullscreenControl:false,clickToGo:true,scrollwheel:true
});
</script></body></html>`
  },
  {
    name: '12: Multiple Gestures',
    desc: 'Alle Gesture-Flags + motionTracking',
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>*{margin:0;padding:0}html,body,#pano{width:100%;height:100%;overflow:hidden;background:#000}</style>
</head><body><div id="pano"></div>
<script src="https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=streetView"></script>
<script>
new google.maps.StreetViewPanorama(document.getElementById('pano'),{
  position:{lat:${LAT},lng:${LNG}},pov:{heading:0,pitch:0},zoom:1,
  addressControl:true,linksControl:true,panControl:true,zoomControl:true,
  fullscreenControl:true,clickToGo:true,scrollwheel:true,
  motionTracking:true,motionTrackingControl:true,
  enableCloseButton:false,showRoadLabels:true
});
</script></body></html>`
  },
];

export default function StreetViewDebug() {
  const [active, setActive] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <ScrollView horizontal style={styles.tabBar} showsHorizontalScrollIndicator={false}>
        {APPROACHES.map((a, i) => (
          <TouchableOpacity key={i} style={[styles.tab, i === active && styles.tabActive]}
            onPress={() => { setActive(i); setLogs([]); }}>
            <Text style={[styles.tabText, i === active && styles.tabTextActive]}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* WebView */}
      <View style={styles.webviewContainer}>
        <WebView
          key={active}
          source={{ html: APPROACHES[active].html }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          scrollEnabled={true}
          onError={(e) => addLog('ERROR: ' + e.nativeEvent.description)}
          onHttpError={(e) => addLog('HTTP: ' + e.nativeEvent.statusCode)}
          onMessage={(e) => addLog('MSG: ' + e.nativeEvent.data)}
          onLoadStart={() => addLog('Loading...')}
          onLoadEnd={() => addLog('Loaded')}
          userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
        />
      </View>

      {/* Info Bar */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>{APPROACHES[active].desc}</Text>
      </View>

      {/* Log */}
      <ScrollView style={styles.logBox}>
        {logs.map((l, i) => <Text key={i} style={styles.logLine}>{l}</Text>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  tabBar: { maxHeight: 44, backgroundColor: '#111', flexGrow: 0 },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#e94560' },
  tabText: { color: '#666', fontSize: 11 },
  tabTextActive: { color: '#fff' },
  webviewContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#000' },
  infoBar: { padding: 6, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222' },
  infoText: { color: '#888', fontSize: 11, textAlign: 'center' },
  logBox: { maxHeight: 80, backgroundColor: '#0a0a0a', padding: 6 },
  logLine: { color: '#4ade80', fontSize: 10, fontFamily: 'monospace', marginBottom: 2 },
});
