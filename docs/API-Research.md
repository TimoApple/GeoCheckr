# API Research — GeoCheckr

## STREET VIEW APIs

### 1. Mapillary (EMPFOHLEN)
- **Status:** Meta/Facebook (seit 2020)
- **Lizenz:** CC-BY-SA 4.0 (kostenlos)
- **API:** https://graph.mapillary.com/
- **Coverage:** Global, crowdsourced
- **Kosten:** Kostenlos
- **Vorteile:**
  - Kostenlos für kommerzielle Nutzung
  - CC-BY-SA = ok für Brettspiel
  - Gute API-Dokumentation
  - OSM-Integration
- **Nachteile:**
  - Weniger Abdeckung als Google
  - Qualität variiert
  - Website manchmal down
- **Registrierung:** https://www.mapillary.com/dashboard/developers

### 2. Google Street View Static API
- **Status:** Google
- **Lizenz:** Kommerziell ($7/1000 Requests)
- **API:** https://developers.google.com/maps/documentation/streetview
- **Coverage:** Beste weltweit
- **Kosten:** $7 pro 1000 Requests
- **Vorteile:**
  - Beste Qualität
  - Beste Abdeckung
  - Bekannteste Marke
- **Nachteile:**
  - Teuer bei vielen Requests
  - API-Key nötig
  - Nutzungsbedingungen einschränkend

### 3. Panoramax (FLOSS)
- **Status:** Community-basiert
- **Lizenz:** Vollständig Open Source
- **API:** https://api.panoramax.xyz/
- **Coverage:** Europa (wachsend)
- **Kosten:** Kostenlos
- **Vorteile:**
  - 100% Open Source
  - Europäisch (Datenschutz)
  - Keine Kosten
- **Nachteile:**
  - Geringe Abdeckung
  - Noch in Entwicklung

### 4. KartaView (OpenStreetCam)
- **Status:** Grab (seit 2020)
- **Lizenz:** Kostenlos
- **API:** https://kartaview.org/api
- **Coverage:** Gering
- **Kosten:** Kostenlos
- **Vorteile:**
  - Kostenlos
  - OSM-Integration
- **Nachteile:**
  - Geringe Abdeckung
  - Weniger Aktivität

## KARTEN APIs

### 1. OpenStreetMap (EMPFOHLEN)
- **Lizenz:** ODbL (kostenlos)
- **API:** https://www.openstreetmap.org/api
- **Kosten:** Kostenlos
- **Tiles:** https://tile.openstreetmap.org/

### 2. Leaflet.js
- **Lizenz:** BSD-2 (kostenlos)
- **API:** https://leafletjs.com/
- **Kosten:** Kostenlos
- **Integration:** React Native WebView

### 3. Mapbox
- **Lizenz:** Kommerziell (200k requests free)
- **API:** https://docs.mapbox.com/
- **Kosten:** Kostenlos bis 200k requests

## SPRACH-ERKENNUNG

### 1. Web Speech API (EMPFOHLEN)
- **Lizenz:** Browser API (kostenlos)
- **API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Kosten:** Kostenlos
- **Support:** Chrome, Safari, Edge

### 2. Google Cloud Speech-to-Text
- **Lizenz:** Kommerziell ($0.006/15s)
- **API:** https://cloud.google.com/speech-to-text
- **Kosten:** $0.006 pro 15 Sekunden

## BACKEND

### 1. Firebase (EMPFOHLEN)
- **Lizenz:** Kostenlos bis 10k Nutzer
- **API:** https://firebase.google.com/
- **Kosten:** Kostenlos (Spark Plan)
- **Features:** Auth, Firestore, Functions, Hosting

### 2. Supabase
- **Lizenz:** Kostenlos bis 50k rows
- **API:** https://supabase.com/
- **Kosten:** Kostenlos (Free Plan)

## EMPFEHLUNG FÜR GEOCHECKR

**Primär Stack:**
- Street View: Mapillary (kostenlos, CC-BY-SA)
- Karten: OpenStreetMap + Leaflet.js
- Sprache: Web Speech API
- Backend: Firebase (kostenlos bis 10k Nutzer)

**Fallback:**
- Street View: Wikimedia Commons Bilder
- Karten: OpenStreetMap Static Maps
- Sprache: Texteingabe
- Backend: Supabase

**Später (bei Budget):**
- Street View: Google API ($7/1000)
- Sprache: Google Cloud Speech
- Karten: Mapbox (200k free)
