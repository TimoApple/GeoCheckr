# GeoCheckr App

Geografie-Party-Spiel mit QR-Code Mechanik.

## Status

✅ **App läuft!** expo-doctor 17/17, Web Build erfolgreich, alle Tests bestanden

## Features

- 📱 QR-Code Scanner (expo-camera)
- 🗺️ OpenStreetMap Integration
- 🎤 Spracheingabe (Web Speech API)
- 🌍 200 Locations weltweit
- 👥 2-8 Spieler
- 📊 Punktesystem
- 🎨 Dunkles Theme
- 📱 Tutorial für neue Spieler

## Screens

1. **HomeScreen** — Hauptmenü
2. **SetupScreen** — Spieler, Schwierigkeit, Ziel
3. **GameScreen** — Hauptspiel (QR → Bild → Antwort)
4. **ResultScreen** — Endstand
5. **TutorialScreen** — Onboarding

## Components

- **QRScanner** — Kamera-basierte QR-Erkennung
- **StreetViewImage** — Wikimedia + Picsum Fallback
- **MapView** — OSM Karte mit Stadtauswahl
- **VoiceInput** — Text/Spracheingabe

## Development

```bash
npm install
npx expo start
npx expo-doctor  # 17/17 Checks
npx ts-node src/__tests__/gameLogic.test.ts  # Tests
npx expo export --platform web  # Web Build
```

## Documentation

- `docs/User-Guide.md` — Spielanleitung
- `docs/Developer-Guide.md` — Entwicklung
- `docs/Deployment-Guide.md` — App Store
- `docs/API-Research.md` — API Vergleich
- `docs/App-Store-Listing.md` — Store Texte

## Projekt-Struktur

```
GeoCheckr_App/
├── App.tsx                 # Navigation
├── src/
│   ├── screens/            # 5 Screens
│   ├── components/         # 4 Components
│   ├── data/               # 200 Locations
│   ├── types/              # TypeScript Types
│   ├── utils/              # Utilities
│   └── __tests__/          # Tests
├── qr_codes/               # 200 QR-Codes
└── docs/                   # 5 Dokumente
```

## GitHub

- Repo: TimoApple/GeoCheckr
- Branch: main
- Commits: 34+
- Stand: 85% fertig

## Nächste Schritte

1. App auf echtem Gerät testen (Expo Go)
2. Mapillary API integrieren
3. Firebase Backend
4. App Store vorbereiten
