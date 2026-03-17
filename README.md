# GeoCheckr App 🌍

Geografie-Party-Spiel mit QR-Code Mechanik — "Hitster trifft GeoGuessr"

## Status: Beta (17.03.2026)

### ✅ Funktioniert
- Spieler-Setup (2-10 Spieler)
- QR-Code Scanner (simuliert)
- 360° Panorama Viewer (WebView + Google Maps)
- Timer-Countdown (30 Sekunden)
- Voice Input (Sprache + Text)
- Distanz-Berechnung (Haversine-Formel)
- Punkte-System (3/2/1/0 basierend auf Distanz)
- Runden-System (1-maxRounds)
- Summary-Screen mit Leaderboard
- 200 Location-Datenbank
- 10 Panorama-Locations

### 🔧 In Arbeit
- Panoramen mit API Key (Timo holt heute)
- Sound-Effekte
- Menu Auto-Hide
- Distanz-Formatierung

## Aufbau

```
src/
├── screens/
│   ├── GameScreen.tsx      # Hauptspiel
│   ├── SetupScreen.tsx     # Spieler-Setup
│   ├── MenuScreen.tsx      # Hauptmenü
│   └── SummaryScreen.tsx   # Ergebnisse
├── components/
│   ├── VoiceInput.tsx      # Sprach- + Texteingabe
│   ├── StreetViewImage.tsx # Panorama-Bild
│   ├── Panorama360Viewer.tsx # 360° WebView
│   └── MapView.tsx         # Karten-Ansicht
├── data/
│   ├── locations_complete.ts # 200 Locations
│   ├── panoramaLocations.ts  # 10 Panorama-URLs
│   └── locationImages.ts     # Fallback-Bilder
├── utils/
│   ├── distance.ts         # Haversine + Punkte
│   └── sounds.ts           # Audio-System
└── types/
    ├── location.ts         # Location-Typen
    └── game.ts             # Spiel-Typen
```

## Build

### Lokal
```bash
npx expo start
```

### APK (GitHub Actions)
```bash
git push  # Triggert automatisch Build
# APK in Actions → Artifacts
```

## API Key Setup

1. Google Cloud Console → APIs → Maps Embed API
2. Key erstellen
3. In `src/config/api.ts` einfügen

## Links

- GitHub: https://github.com/TimoApple/GeoCheckr
- Drive: https://drive.google.com/drive/folders/14YSPsUy-X4PnEpDghyA_0KLEmexXZ3m6
