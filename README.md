# GeoCheckr 🌍

**Location-Guessing Spiel mit QR-Codes für den realen Raum**

---

## Was ist GeoCheckr?

GeoCheckr ist ein Multiplayer Geo-Guessing-Spiel:
- QR-Codes an beliebigen Orten aufhängen
- Spieler scannen → sehen Street View → raten die Stadt
- Punkte für richtige Antworten
- 2-8 Spieler, perfekt für Kneipen, Schulen, Events

## Projekt-Struktur

```
GeoCheckr_App/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Startscreen
│   │   ├── SetupScreen.tsx     # Spieler, Schwierigkeit, Ziel
│   │   ├── GameScreen.tsx      # Hauptspiel (QR, Timer, Raten)
│   │   └── ResultScreen.tsx    # Endstand & Gewinner
│   ├── data/
│   │   └── locations.ts        # 200 Locations mit Koordinaten
│   └── utils/
│       └── gameUtils.ts        # Haversine, Scoring, Distractors
├── qr-codes/                   # 200 QR-Code PNGs
├── GeoCheckr_QR_Codes_Print.pdf  # Druckfertiges PDF
├── PITCH.md                    # Pitch-Deck
├── App.tsx                     # Navigation
└── package.json
```

## Setup

```bash
cd GeoCheckr_App
npm install
npx expo start
```

## Gameplay

1. **Setup:** 2-8 Spieler, Schwierigkeit wählen, Ziel-Score setzen
2. **Runde:** Spieler scannt QR-Code (oder spielt ohne)
3. **Beobachten:** 15-45 Sekunden Zeit (je nach Schwierigkeit)
4. **Raten:** 4 Stadtoptionen, 1 ist richtig
5. **Punkte:** 50-1000 basierend auf Nähe + Geschwindigkeit
6. **Sieg:** Erster zum Ziel-Score gewinnt

## QR-Codes

- 200 QR-Codes im Ordner `qr-codes/`
- Print-PDF: `GeoCheckr_QR_Codes_Print.pdf`
- Jeder Code: `QR001` bis `QR200`
- Drucken, ausschneiden, aufhängen, spielen!

## Tech Stack

- React Native (Expo)
- TypeScript
- Expo Camera (QR-Scanning)
- Google Street View API (optional)

## Nächste Schritte

- [ ] Street View API Integration (Google API Key)
- [ ] Online-Multiplayer (WebSocket/Firebase)
- [ ] Schul-Kit (Lehrmaterial + QR-Pakete)
- [ ] App Store Deployment
- [ ] B2B Dashboard für Unternehmen

---

*© 2026 GeoCheckr — Jeder Ort kann ein Spiel werden.*
