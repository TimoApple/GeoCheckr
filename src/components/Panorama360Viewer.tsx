import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Panorama360ViewerProps {
  imageUrl: string;
  locationName?: string;
}

const { width, height } = Dimensions.get('window');

export default function Panorama360Viewer({ imageUrl, locationName }: Panorama360ViewerProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // HTML mit einem einfachen 360°-Panorama-Viewer
  // Nutzt Three.js für WebGL-Rendering auf einer Kugel
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      overflow: hidden; 
      background: #1a1a2e; 
      touch-action: none;
    }
    #viewer { 
      width: 100vw; 
      height: 100vh; 
      cursor: grab;
    }
    #viewer:active { cursor: grabbing; }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-family: sans-serif;
      font-size: 16px;
      text-align: center;
    }
    #loading .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #333;
      border-top: 3px solid #e94560;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    #instructions {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.6);
      font-family: sans-serif;
      font-size: 12px;
      background: rgba(0,0,0,0.5);
      padding: 8px 16px;
      border-radius: 20px;
      pointer-events: none;
      transition: opacity 2s;
    }
    #compass {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 50px;
      height: 50px;
      background: rgba(0,0,0,0.5);
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      font-family: sans-serif;
    }
    #compass::after {
      content: '🧭';
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div>Lade Panorama...</div>
  </div>
  <canvas id="viewer"></canvas>
  <div id="instructions">👆 Ziehen zum Drehen • 👌 Zoom mit 2 Fingern</div>
  <div id="compass"></div>

  <script>
    // Minimaler 360°-Panorama-Viewer mit Canvas (ohne externe Libraries)
    const canvas = document.getElementById('viewer');
    const ctx = canvas.getContext('2d');
    const loading = document.getElementById('loading');
    const instructions = document.getElementById('instructions');
    
    let img = new Image();
    let rotation = 0;      // Horizontal rotation (yaw)
    let pitch = 0;         // Vertical rotation (pitch)
    let fov = 75;          // Field of view
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let imgLoaded = false;
    let autoRotate = true;
    
    // Setup canvas
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (imgLoaded) render();
    }
    window.addEventListener('resize', resize);
    resize();
    
    // Load image
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      imgLoaded = true;
      loading.style.display = 'none';
      render();
      // Start auto-rotate
      autoRotateLoop();
    };
    img.onerror = function() {
      loading.innerHTML = '<div style="color:#e94560">❌ Bild konnte nicht geladen werden</div>';
    };
    img.src = '${imageUrl}';
    
    // Render equirectangular projection
    function render() {
      if (!imgLoaded) return;
      
      const w = canvas.width;
      const h = canvas.height;
      
      // Clear
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, w, h);
      
      // Calculate source coordinates based on rotation
      const imgW = img.width;
      const imgH = img.height;
      
      // Horizontal offset based on rotation
      const srcX = ((rotation % 360) / 360) * imgW;
      const srcY = (pitch / 90) * (imgH / 2) + imgH / 4;
      
      // Visible portion based on FOV
      const visibleWidth = (fov / 360) * imgW;
      const visibleHeight = (fov / 360) * imgH;
      
      // Draw the visible portion stretched to canvas
      const srcY_clamped = Math.max(0, Math.min(imgH - visibleHeight, srcY - visibleHeight/2));
      
      try {
        // Draw main image
        ctx.drawImage(
          img,
          srcX - visibleWidth/2, srcY_clamped,
          visibleWidth, visibleHeight,
          0, 0, w, h
        );
        
        // Handle wrapping at edges
        if (srcX - visibleWidth/2 < 0) {
          ctx.drawImage(
            img,
            imgW + (srcX - visibleWidth/2), srcY_clamped,
            visibleWidth, visibleHeight,
            0, 0, w, h
          );
        }
        if (srcX + visibleWidth/2 > imgW) {
          ctx.drawImage(
            img,
            (srcX + visibleWidth/2) - imgW, srcY_clamped,
            visibleWidth, visibleHeight,
            0, 0, w, h
          );
        }
      } catch(e) {
        // Fallback: simple centered image
        ctx.drawImage(img, 0, 0, imgW, imgH, 0, 0, w, h);
      }
    }
    
    // Auto-rotate
    let autoRotateId;
    function autoRotateLoop() {
      if (autoRotate && !isDragging) {
        rotation += 0.15;
        render();
      }
      autoRotateId = requestAnimationFrame(autoRotateLoop);
    }
    
    // Touch/Mouse handling
    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      autoRotate = false;
      lastX = e.clientX;
      lastY = e.clientY;
      instructions.style.opacity = '0';
    });
    
    canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotation -= dx * 0.3;
      pitch = Math.max(-60, Math.min(60, pitch + dy * 0.3));
      lastX = e.clientX;
      lastY = e.clientY;
      render();
    });
    
    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 3000);
    });
    
    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        instructions.style.opacity = '0';
      }
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      rotation -= dx * 0.3;
      pitch = Math.max(-60, Math.min(60, pitch + dy * 0.3));
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      render();
      e.preventDefault();
    }, { passive: false });
    
    canvas.addEventListener('touchend', () => {
      isDragging = false;
      setTimeout(() => { autoRotate = true; }, 3000);
    });
    
    // Mouse wheel zoom
    canvas.addEventListener('wheel', (e) => {
      fov = Math.max(30, Math.min(120, fov + e.deltaY * 0.05));
      render();
      e.preventDefault();
    }, { passive: false });
    
    // Pinch zoom
    let initialPinchDistance = 0;
    let initialFov = 75;
    
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx*dx + dy*dy);
        initialFov = fov;
      }
    });
    
    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        const scale = initialPinchDistance / distance;
        fov = Math.max(30, Math.min(120, initialFov * scale));
        render();
        e.preventDefault();
      }
    }, { passive: false });
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => console.error('WebView error:', e)}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
