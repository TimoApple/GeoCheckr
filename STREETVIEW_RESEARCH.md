# StreetView Research — 22. März 2026

## 🎯 ROOT CAUSE: API Restrictions

**Hauptproblem:** API Key `AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI` ist restricted auf "HTTP referrers" → Blockiert Maps JavaScript API komplett.

**Fix:** In Google Cloud Console → APIs & Services → Credentials → API Key → Restrictions → "Don't restrict key" oder explizit "Maps JavaScript API" + "Maps SDK for Android" aktivieren.

## 🔬 Google's Official Samples — CRITICAL FINDINGS

### 1. getStreetViewPanoramaAsync (NEUER API)
```kotlin
// ❌ ALT (deprecated, in neueren Versionen entfernt):
override fun onStreetViewPanoramaReady(panorama: StreetViewPanorama) { }

// ✅ NEU (Google's aktuelle Demos):
fragment.getStreetViewPanoramaAsync { panorama: StreetViewPanorama ->
    panorama.setPosition(location)
    panorama.isPanningGesturesEnabled = true
    panorama.isZoomGesturesEnabled = true
}
```

### 2. StreetViewPanoramaView Lifecycle (KRITISCH!)
```kotlin
// KRITISCH: Bundle NUR für StreetView View verwenden!
streetViewPanoramaView.onCreate(savedInstanceState?.getBundle(STREETVIEW_BUNDLE_KEY))

// Ohne diesen Bundle kann der View nicht laden!
private const val STREETVIEW_BUNDLE_KEY = "StreetViewBundleKey"
```

### 3. Fragment Layout
```xml
<!-- ✅ FragmentContainerView (Google's Demo) -->
<androidx.fragment.app.FragmentContainerView
    android:id="@+id/streetviewpanorama"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    class="com.google.android.gms.maps.SupportStreetViewPanoramaFragment" />

<!-- ❌ Altes <fragment> Tag -->
<fragment
    class="com.google.android.gms.maps.SupportStreetViewPanoramaFragment" />
```

### 4. StreetViewPanoramaOptions
```kotlin
val options = StreetViewPanoramaOptions()
    .position(location)      // LatLng
    .panningGesturesEnabled(true)  // ← WICHTIG für Navigation!
    .zoomGesturesEnabled(true)     // ← WICHTIG für Zoom!
    .userNavigationEnabled(true)   // ← WICHTIG für Link-Klicks!
    .streetNamesEnabled(false)     // Labels ausblenden
```

### 5. play-services-maps Versionen
- **20.0.0** (Jan 2026): Entfernt `org.apache.http.legacy` → Crashes wenn `<uses-library>` fehlt
- **19.2.0** (Apr 2025): Stabil, wird von Expo 54 unterstützt
- **19.0.0** (Jun 2024): minSdkVersion 21

**Fix für 20.0.0:**
```xml
<uses-library android:name="org.apache.http.legacy" android:required="false"/>
```

## 🛠️ APK Ansätze (3-Tier Fallback)

### Ansatz 1: Fragment + getStreetViewPanoramaAsync
- **File:** `StreetViewActivity.kt`
- **Methode:** Fragment programmatisch erstellen
- **Vorteil:** Google's offizieller Ansatz
- **Nachteil:** Braucht getSupportFragmentManager

### Ansatz 2: StreetViewPanoramaView + Options
- **File:** `StreetViewActivityOptions.kt`
- **Methode:** View mit Options erstellen
- **Vorteil:** Kein Fragment-Overhead
- **Nachteil:** Lifecycle manuell verwalten (KRITISCH!)

### Ansatz 3: WebView + Maps JavaScript API
- **File:** `StreetViewActivityWebView.kt`
- **Methode:** Gleicher Code wie test-standalone.html
- **Vorteile:**
  - 100% identisch mit working web version
  - Touch/Gesten funktionieren (WebView handhabt das)
  - JavaScript API ist gut dokumentiert
- **Nachteile:**
  - Braucht Maps JavaScript API im API Key
  - Performance ist geringer als native

## 📋 Events (Google's Options Demo)

```kotlin
panorama.setOnStreetViewPanoramaChangeListener(this)
panorama.setOnStreetViewPanoramaCameraChangeListener(this)
panorama.setOnStreetViewPanoramaClickListener(this)
panorama.setOnStreetViewPanoramaLongClickListener(this)
```

## ⚠️ Best Practices

1. **IMMER** `getStreetViewPanoramaAsync` statt `OnStreetViewPanoramaReadyListener`
2. **IMMER** StreetView Bundle separat speichern (nicht in savedInstanceState)
3. **IMMER** `isPanningGesturesEnabled = true` setzen
4. **IMMER** `isZoomGesturesEnabled = true` setzen
5. **IMMER** `isUserNavigationEnabled = true` setzen
6. **NIEMALS** alle Activity-Abhängigkeiten in savedInstanceState mixen

## 🔗 Quellen

- [Basic Demo](https://github.com/googlemaps-samples/android-samples/blob/main/ApiDemos/project/kotlin-app/src/main/java/com/example/kotlindemos/StreetViewPanoramaBasicDemoActivity.kt)
- [View Demo](https://github.com/googlemaps-samples/android-samples/blob/main/ApiDemos/project/kotlin-app/src/main/java/com/example/kotlindemos/StreetViewPanoramaViewDemoActivity.kt)
- [Options Demo](https://github.com/googlemaps-samples/android-samples/blob/main/ApiDemos/project/kotlin-app/src/main/java/com/example/kotlindemos/StreetViewPanoramaOptionsDemoActivity.kt)
- [Navigation Demo](https://github.com/googlemaps-samples/android-samples/blob/main/ApiDemos/project/kotlin-app/src/main/java/com/example/kotlindemos/StreetViewPanoramaNavigationDemoActivity.kt)
- [Events Demo](https://github.com/googlemaps-samples/android-samples/blob/main/ApiDemos/project/kotlin-app/src/main/java/com/example/kotlindemos/StreetViewPanoramaEventsDemoActivity.kt)
- [Release Notes](https://developers.google.com/maps/documentation/android-sdk/release-notes)
