# Developer Guide — GeoCheckr

## TECH STACK

- **Framework:** React Native (Expo SDK 52)
- **Language:** TypeScript
- **Navigation:** React Navigation 6
- **Maps:** OpenStreetMap (Leaflet.js)
- **Street View:** Mapillary (CC-BY-SA)
- **Speech:** Web Speech API
- **Backend:** Firebase (geplant)
- **State:** React Hooks

## PROJEKT STRUKTUR

```
GeoCheckr_App/
├── App.tsx                 # Navigation + Root
├── app.json                # Expo Config
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript Config
├── index.ts                # Entry Point
├── assets/                 # Icons, Splash
├── src/
│   ├── screens/            # App Screens
│   │   ├── HomeScreen.tsx
│   │   ├── SetupScreen.tsx
│   │   ├── GameScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   └── TutorialScreen.tsx
│   ├── components/         # Reusable Components
│   │   ├── QRScanner.tsx
│   │   ├── StreetViewImage.tsx
│   │   ├── MapView.tsx
│   │   └── VoiceInput.tsx
│   ├── data/               # Location Data
│   │   └── locations_complete.ts
│   ├── types/              # TypeScript Types
│   │   ├── game.ts
│   │   └── location.ts
│   ├── utils/              # Utility Functions
│   │   ├── distance.ts
│   │   ├── gameUtils.ts
│   │   └── testDistance.ts
│   └── __tests__/          # Tests
│       └── gameLogic.test.ts
├── qr_codes/               # QR Code PNGs
└── docs/                   # Documentation
    ├── API-Research.md
    ├── Deployment-Guide.md
    ├── User-Guide.md
    └── App-Store-Listing.md
```

## SCREENS

### HomeScreen
- Hauptmenü
- Navigation zu Setup, Anleitung, Einstellungen

### SetupScreen
- Spieler hinzufügen/entfernen
- Schwierigkeit wählen
- Ziel-Score setzen
- Spiel starten

### GameScreen
- QR-Code scannen (simuliert)
- Bild anzeigen (30s Timer)
- Antwort-Eingabe
- Ergebnis anzeigen
- Punktestand

### ResultScreen
- Endstand
- Gewinner-Display
- Neues Spiel / Hauptmenü

### TutorialScreen
- 5-Schritt Onboarding
- AsyncStorage Persistenz

## COMPONENTS

### QRScanner
- Kamera-basiert
- expo-camera Integration
- QR-Code Erkennung

### StreetViewImage
- Wikimedia Commons Bilder
- Picsum Fallback
- Difficulty-basierter Blur

### MapView
- OpenStreetMap Integration
- Stadtauswahl-Buttons
- External Link

### VoiceInput
- Web Speech API
- Text-Fallback
- Spracheingabe

## UTILS

### distance.ts
- Haversine-Formel
- Distanz in km
- Punkteberechnung

### gameUtils.ts
- Player/GameState Types
- Random Location
- Win Condition

### testDistance.ts
- Unit Tests
- Haversine Validierung

## TYPES

### Location
- id, city, country, region, continent
- lat, lng, difficulty, qrCode
- landmark?, hint? (optional)

### Player
- id, name, score, cards, chips

### GameState
- players, currentPlayerIndex, currentLocation
- phase, timer, round, targetScore, difficulty, history

## DEPENDENCIES

### Production
- expo (SDK 52)
- react (18.3.1)
- react-native (0.76.9)
- @react-navigation/native
- @react-navigation/native-stack
- react-native-screens
- react-native-safe-area-context
- expo-camera
- @react-native-async-storage/async-storage

### Development
- @types/react
- typescript
- ts-node (testing)

## DEVELOPMENT

### Starten
```bash
npm install
npx expo start
```

### Tests
```bash
npx ts-node src/__tests__/gameLogic.test.ts
```

### Build
```bash
npx expo export --platform web
```

### Doctor
```bash
npx expo-doctor
```

## GIT WORKFLOW

### Branches
- main: Production
- develop: Development
- feature/*: New features

### Commits
- feat: New feature
- fix: Bug fix
- docs: Documentation
- test: Tests
- refactor: Code cleanup

### Beispiel
```bash
git checkout -b feature/new-screen
git add .
git commit -m "feat: Add new screen"
git push origin feature/new-screen
```

## TESTING

### Unit Tests
- Haversine-Formel
- Punkteberechnung
- Win Condition
- Player Rotation

### Integration Tests
- Screen Navigation
- Game Flow
- QR-Scanning

### Manual Tests
- Expo Go auf echtem Gerät
- Alle Screens durchgehen
- Edge Cases testen

## DEBUGGING

### Console Logs
```typescript
console.log('Debug:', variable);
```

### React DevTools
```bash
npx react-devtools
```

### Expo DevTools
```bash
npx expo start --dev-client
```

## PERFORMANCE

### Optimization
- React.memo für Components
- useCallback für Handler
- useMemo für Berechnungen
- Lazy Loading für Bilder

### Monitoring
- Firebase Crashlytics
- Reactotron (Dev)
- Flipper (Dev)

## SECURITY

### API Keys
- Expo Secrets nutzen
- Nicht in Code committen
- Environment Variables

### Daten
- Keine sensiblen Daten
- Nur öffentliche Locations
- Firebase Rules

## NÄCHSTE SCHRITTE

1. Firebase Integration
2. Mapillary API
3. Push Notifications
4. Offline Support
5. Analytics
