# GeoCheckr App

Geografie-Party-Spiel mit QR-Code Mechanik.

## Status

✅ **App läuft!** expo-doctor 17/17, Web Build erfolgreich

## Features

- 📱 QR-Code Scanner (expo-camera)
- 🗺️ OpenStreetMap Integration
- 🎤 Spracheingabe (Web Speech API)
- 🌍 200 Locations weltweit
- 👥 2-8 Spieler
- 📊 Punktesystem
- 🎨 Dunkles Theme

## Tech Stack

- React Native / Expo SDK 52
- TypeScript
- OpenStreetMap (Leaflet.js)
- Firebase (geplant)
- Mapillary / Wikimedia Commons (Street View)

## Screens

1. **HomeScreen** — Hauptmenü
2. **SetupScreen** — Spieler, Schwierigkeit, Ziel
3. **GameScreen** — Hauptspiel (QR → Bild → Antwort)
4. **ResultScreen** — Endstand

## Components

- **QRScanner** — Kamera-basierte QR-Erkennung
- **StreetViewImage** — Wikimedia + Picsum Fallback
- **MapView** — OSM Karte mit Stadtauswahl
- **VoiceInput** — Text/Spracheingabe

## Development

```bash
npm install
npx expo start
npx expo export --platform web
```

## Testing

```bash
npx expo-doctor  # 17/17 Checks
npx ts-node src/utils/testDistance.ts  # Haversine Tests
```

## Projekt-Struktur

```
GeoCheckr_App/
├── App.tsx
├── src/
│   ├── screens/
│   ├── components/
│   ├── data/
│   └── utils/
├── qr_codes/
├── docs/
└── assets/
```

## Nächste Schritte

1. App auf echtem Gerät testen (Expo Go)
2. Mapillary API integrieren
3. Firebase Backend
4. Druckbare QR-Karten
