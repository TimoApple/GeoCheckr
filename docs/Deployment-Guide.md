# Deployment Guide — GeoCheckr

## EXPO GO (Testing)

### 1. App starten
```bash
cd GeoCheckr_App
npx expo start
```

### 2. QR-Code scannen
- iOS: Kamera-App oder Expo Go App
- Android: Expo Go App

### 3. Testen
- Alle 5 Screens durchgehen
- QR-Scanner testen (simuliert)
- Timer testen (30s)
- Punktesystem testen

## PRODUCTION BUILD

### iOS (App Store)
1. **Apple Developer Account** ($99/Jahr)
2. **EAS Build konfigurieren:**
   ```bash
   npx eas-cli build --platform ios
   ```
3. **App Store Connect:**
   - App erstellen
   - Screenshots hochladen
   - Beschreibung + Keywords
   - Review einreichen

### Android (Google Play)
1. **Google Play Developer** ($25 einmalig)
2. **EAS Build konfigurieren:**
   ```bash
   npx eas-cli build --platform android
   ```
3. **Google Play Console:**
   - App erstellen
   - Screenshots hochladen
   - Beschreibung + Keywords
   - Review einreichen

## WEB BUILD

### Vercel (EMPFOHLEN)
```bash
npx expo export --platform web
vercel deploy dist/
```

### Netlify
```bash
npx expo export --platform web
netlify deploy --dir=dist --prod
```

### Firebase Hosting
```bash
npx expo export --platform web
firebase deploy
```

## ENVIRONMENT VARIABLES

### Benötigte Keys
```env
# Mapillary API (optional, für Street View)
MAPILLARY_API_KEY=your_key_here

# Firebase (optional, für Backend)
FIREBASE_API_KEY=your_key_here
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project

# Google Cloud (optional, für bessere Street View)
GOOGLE_MAPS_API_KEY=your_key_here
```

### Expo Secrets
```bash
npx expo secret:set MAPILLARY_API_KEY=your_key
npx expo secret:set FIREBASE_API_KEY=your_key
```

## APP STORE ASSETS

### Screenshots (6.7" iPhone)
1. HomeScreen (Hauptmenü)
2. SetupScreen (Spieler-Setup)
3. GameScreen (Spiel mit Bild)
4. GameScreen (Antwort-Phase)
5. ResultScreen (Endstand)
6. TutorialScreen (Onboarding)

### App Icon
- Größe: 1024x1024 px
- Format: PNG (kein Alpha)
- Keine Rundungen (iOS macht das automatisch)

### App Store Beschreibung
Siehe `docs/App-Store-Listing.md`

## MONITORING

### Crashlytics (Firebase)
```bash
npx expo install @react-native-firebase/crashlytics
```

### Analytics (Firebase)
```bash
npx expo install @react-native-firebase/analytics
```

## CI/CD (GitHub Actions)

### Expo Build
```yaml
name: Build Expo App
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx expo-doctor
      - run: npx expo export --platform web
```

## NÄCHSTE SCHRITTE

1. **Testing:** App auf echtem Gerät testen
2. **API Keys:** Mapillary + Firebase registrieren
3. **Build:** EAS Build konfigurieren
4. **Store:** App Store + Google Play einreichen
5. **Marketing:** Launch-Kampagne starten
