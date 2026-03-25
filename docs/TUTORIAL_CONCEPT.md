# GeoCheckr Tutorial — Swipe-Konzept

## Aktuell
- Kein Tutorial implementiert
- Swipe-Mechanik existiert nicht

## Timo's Vision: Kontinuierliche Hintergrund-Grafik
Statt einzelner Tutorial-Seiten (Slide 1, Slide 2, Slide 3...) soll es sich anfühlen, als würde man sich auf **einer großen Grafik** bewegen.

### Wie es funktioniert:
1. **Eine große Grafik** (z.B. 3000px breit × viewport hoch) liegt im Hintergrund
2. **User swiped links → rechts** und die Grafik scrollt sichtbar
3. **Overlay-Elemente** erscheinen an fixen Positionen über der Grafik:
   - Pfeil-Indikatoren ("Swipe →")
   - Text-Hinweise an relevanten Stellen
   - Punkte/Marker auf der Karte
4. **Effekt:** Man erkundet eine große Weltkarte / Infografik

### Mögliche Grafik-Elemente:
- **Weltkarte-Silhouette** (kontinuierlich, nicht zerteilt)
- **Topographische Linien** (wie bg-contours.svg, aber größer)
- **Location-Pins** an verschiedenen Stellen
- **Koordinaten-Grid** als Leitlinien
- **GeoCheckr Logo** als Kompass-Nadel

### Technische Umsetzung:
```html
<!-- Container mit overflow:hidden -->
<div class="tutorial-container" style="overflow-x:scroll;scroll-snap-type:x mandatory;">
  
  <!-- Hintergrund-Grafik (sehr breit) -->
  <div class="tutorial-bg" style="width:300vw;position:relative;">
    
    <!-- SVG Hintergrund -->
    <svg class="world-map-bg" .../>
    
    <!-- Overlay-Stationen (fixe Positionen auf der Grafik) -->
    <div class="station" style="left:10vw;top:30%;">
      <div class="station-icon">📍</div>
      <p>Scanne QR-Codes</p>
    </div>
    
    <div class="station" style="left:40vw;top:50%;">
      <div class="station-icon">🌍</div>
      <p>Erkunde Street View</p>
    </div>
    
    <div class="station" style="left:70vw;top:35%;">
      <div class="station-icon">🏆</div>
      <p>Sammle Punkte</p>
    </div>
    
    <div class="station" style="left:90vw;top:45%;">
      <div class="station-btn">
        <button onclick="closeTutorial()">Start →</button>
      </div>
    </div>
  </div>
</div>

<!-- Swipe-Indikator -->
<div class="swipe-hint">
  <svg>← swipe →</svg>
</div>
```

### CSS Ansatz:
```css
.tutorial-container {
  height: 100vh;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}

.tutorial-bg {
  height: 100%;
  background: url('bg-contours.svg') repeat-x;
  position: relative;
}

.station {
  position: absolute;
  text-align: center;
  animation: fadeInUp 0.5s ease-out;
  scroll-snap-align: center;
}

/* Swipe-Indikator Animation */
.swipe-hint {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  animation: swipeBounce 2s infinite;
}

@keyframes swipeBounce {
  0%, 100% { transform: translateX(-50%); opacity: 0.6; }
  50% { transform: translateX(calc(-50% + 20px)); opacity: 1; }
}
```

## Nächste Schritte
1. Große SVG-Grafik erstellen (Weltkarte + topographische Elemente)
2. Tutorial-Screen in game.js implementieren
3. Scroll-Snap für sanftes Wischen
4. Station-Overlays positionen
5. Swipe-Indikator animieren

## Status
- [x] Konzept definiert
- [ ] SVG-Grafik erstellt
- [ ] Tutorial-Screen implementiert
- [ ] Scroll-Snap CSS
- [ ] Station-Overlays
