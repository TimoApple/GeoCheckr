// GeoCheckr — 360° Panorama Viewer via WebView
// Supports Google Maps Street View URLs and direct panorama images

import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Panorama360ViewerProps {
  imageUrl: string;
  locationName?: string;
}

const { width, height = 400 } = Dimensions.get('window');

export default function Panorama360Viewer({ imageUrl, locationName }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const isGoogleMaps = imageUrl.includes('maps.app.goo.gl') || imageUrl.includes('google.com/maps');
  
  const html = isGoogleMaps ? `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { overflow:hidden; background:#282828; }
iframe { width:100vw; height:100vh; border:none; }
</style>
</head>
<body>
<iframe src="https://www.google.com/maps/embed?pb=!4v1700000000000!6m8!1m7!1s!2m2!1d0!2d0!3f0!4f0!5f0"
  allowfullscreen loading="lazy"
  onload="window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded')">
</iframe>
</body>
</html>` : `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { overflow:hidden; background:#282828; }
#viewer { width:100vw; height:100vh; }
</style>
</head>
<body>
<div id="viewer"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
document.getElementById('viewer').appendChild(renderer.domElement);
const geo=new THREE.SphereGeometry(500,60,40);
geo.scale(-1,1,1);
const tex=new THREE.TextureLoader().load('${imageUrl}',()=>{
  window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('loaded');
});
const mat=new THREE.MeshBasicMaterial({map:tex});
scene.add(new THREE.Mesh(geo,mat));
camera.position.set(0,0,0.1);
let lon=0,lat=0,drag=false,px=0,py=0;
renderer.domElement.addEventListener('touchstart',e=>{drag=true;px=e.touches[0].clientX;py=e.touches[0].clientY;});
renderer.domElement.addEventListener('touchmove',e=>{if(!drag)return;lon+=(px-e.touches[0].clientX)*0.2;lat+=(py-e.touches[0].clientY)*0.2;lat=Math.max(-85,Math.min(85,lat));px=e.touches[0].clientX;py=e.touches[0].clientY;});
renderer.domElement.addEventListener('touchend',()=>drag=false);
function animate(){
  requestAnimationFrame(animate);
  camera.lookAt(
    500*Math.cos(THREE.MathUtils.degToRad(lat))*Math.sin(THREE.MathUtils.degToRad(lon)),
    500*Math.sin(THREE.MathUtils.degToRad(lat)),
    500*Math.cos(THREE.MathUtils.degToRad(lat))*Math.cos(THREE.MathUtils.degToRad(lon))
  );
  renderer.render(scene,camera);
}
animate();
</script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#8343ff" />
          <Text style={styles.loadingText}>Lade 360° Panorama...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(e) => {
          if (e.nativeEvent.data === 'loaded') setLoading(false);
        }}
        onError={() => setLoading(false)}
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282828', borderRadius: 15, overflow: 'hidden' },
  webview: { flex: 1, backgroundColor: '#282828' },
  loading: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: '#282828' },
  loadingText: { color: '#aaa', marginTop: 10, fontSize: 14 },
});
