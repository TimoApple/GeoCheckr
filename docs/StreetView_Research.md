# Street View / Panorama Research

## Aktuelle Lösung: Google Maps Panoramen

### Ansatz
- Timo kuratiert 360° Panorama-Locations manuell
- Jede Location bekommt einen Google Maps Link (maps.app.goo.gl)
- App lädt Link direkt in WebView
- Kein API-Key nötig, keine Kosten

### Vorteile
- ✅ Keine API-Kosten
- ✅ Timo kann Locations vorsortieren (interessante Orte)
- ✅ Funktioniert auf allen Geräten
- ✅ Keine Rate-Limits

### 10 Aktuelle Locations (März 2026)
1. Kyiv, Ukraine (50.49, 30.54)
2. Stornoway, Schottland (58.17, -6.59)
3. Slutsk, Belarus (53.35, 27.08)
4. Lemvig, Dänemark (56.51, 8.12)
5. Brest, Belarus (52.74, 24.18)
6. Sizilien, Italien (36.79, 14.68)
7. Shetland, Schottland (60.83, -0.78)
8. Cáceres, Spanien (39.04, -6.15)
9. Nordfjordeid, Norwegen (61.83, 6.12)
10. Białystok, Polen (53.12, 23.17)

## Alternative APIs (falls nötig)

### Google Street View Static API
- **Kosten:** $7 pro 1000 Requests (28.000 gratis/Monat)
- **Vorteil:** Direkte Bild-URLs, panorama_id support
- **Nachteil:** Kosten ab >28K requests

### Mapillary (Meta/Open Source)
- **Kosten:** Kostenlos (Open Source)
- **Vorteil:** Community-basiert, weltweit
- **Nachteil:** Qualität variiert, nicht überall verfügbar

### Karta View (Open Source)
- **Kosten:** Kostenlos
- **Vorteil:** Open Source Alternative
- **Nachteil:** Weniger Coverage als Google

## Nächste Schritte
- [ ] 190 weitere Panorama-Locations von Timo sammeln
- [ ] Alternative: Google Street View Static API als Fallback
- [ ] Panorama-Viewer optimieren (3D-Steuerung)
