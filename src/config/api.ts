// GeoCheckr — API Configuration
// Timo: Hier deinen Maps Embed API Key eintragen!
// Kostenlos: https://console.cloud.google.com/apis/library/maps-embed-api
export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Fallback: Wenn kein Key, direkte Maps-URL (braucht Cookie-Consent-Hack)
export const USE_EMBED_API = !!GOOGLE_MAPS_API_KEY;
