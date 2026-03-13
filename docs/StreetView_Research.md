# Street View Alternativen — Research

## MAPILLARY (Empfohlen)
- **Lizenz:** CC-BY-SA 4.0 (kostenlos für kommerzielle Nutzung)
- **Besitzer:** Meta (Facebook) seit 2020
- **API:** JSON API verfügbar, dokumentiert
- **Abdeckung:** Global, crowdsourced
- **Vorteile:**
  - Kostenlos
  - CC-BY-SA = nutzbar für Brettspiel
  - Gute API
  - OSM-Integration vorhanden
- **Nachteile:**
  - Weniger Abdeckung als Google
  - Qualität variiert
  - Meta-Daten (Datenschutz?)

## GOOGLE STREET VIEW
- **Kosten:** $7 pro 1000 Requests (Static API)
- **Abdeckung:** Beste weltweit
- **Vorteile:**
  - Beste Qualität
  - Beste Abdeckung
  - Bekannteste Marke
- **Nachteile:**
  - Teuer bei vielen Requests
  - API-Key nötig
  - Nutzungsbedingungen einschränkend

## PANORAMAX (FLOSS Alternative)
- **Lizenz:** Vollständig Open Source
- **Besitzer:** Community-basiert
- **Status:** Neu, wachsend
- **Vorteile:**
  - 100% Open Source
  - Keine Kosten
  - Europäisch (Datenschutz)
- **Nachteile:**
  - Geringe Abdeckung
  - Noch in Entwicklung

## KARTAVIEW (OpenStreetCam)
- **Lizenz:** Kostenlos
- **Besitzer:** Grab (seit 2020)
- **Status:** Noch aktiv, aber weniger Fokus
- **Vorteile:**
  - Kostenlos
  - OSM-Integration
- **Nachteile:**
  - Geringe Abdeckung
  - Weniger Aktivität

## EMPFEHLUNG FÜR GEOCHECKR

**Primär:** Mapillary
- Kostenlos, CC-BY-SA
- Gute API
- Ausreichend für Brettspiel-Zwecke

**Fallback:** OpenStreetMap Static Maps
- Kostenlos
- Kein Street View, aber Kartenansicht
- Für Prototyping geeignet

**Später:** Google Street View
- Wenn Budget vorhanden
- Für bessere Qualität
- Als Premium-Feature

## TECHNISCHE UMSETZUNG

```typescript
// Mapillary API Beispiel
const getImage = async (lat: number, lng: number) => {
  const response = await fetch(
    `https://graph.mapillary.com/images?access_token=TOKEN&fields=id,thumb_2048_url&closeto=${lng},${lat}&limit=1`
  );
  const data = await response.json();
  return data.data[0]?.thumb_2048_url;
};
```

## NÄCHSTE SCHRITTE
1. Mapillary API-Key registrieren
2. Testen mit Beispiel-Koordinaten
3. Abdeckung für 200 Locations prüfen
4. Fallback-Strategie für schlechte Abdeckung
