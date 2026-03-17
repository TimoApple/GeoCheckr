// GeoCheckr — API Configuration
// Add your Google Maps API Key here when available

export const API_CONFIG = {
  // Google Maps Embed API Key (kostenlos bis 28K Requests/Monat)
  // Get it at: https://console.cloud.google.com/apis/library/maps-embed-api
  GOOGLE_MAPS_API_KEY: 'AIzaSyCl3ogHqguF1QcwhyHdvJmUkbgx3bpKLJI',  // ✅ Timo 17.03

  // Street View Static API (optional, $7/1000 Requests)
  STREET_VIEW_API_KEY: '',

  // App Settings
  DEFAULT_TIMER_SECONDS: 30,
  DEFAULT_ROUNDS: 10,
  DEFAULT_DIFFICULTY: 'mittel' as 'leicht' | 'mittel' | 'schwer',

  // Points
  POINTS_PERFECT: 3,    // < 100km
  POINTS_GOOD: 2,       // < 500km
  POINTS_OK: 1,         // < 2000km
  POINTS_MISS: 0,       // >= 2000km
};

// Generate Google Maps Embed URL with API Key
export function getPanoramaEmbedUrl(lat: number, lng: number, apiKey?: string): string {
  const key = apiKey || API_CONFIG.GOOGLE_MAPS_API_KEY;
  if (key) {
    return `https://www.google.com/maps/embed/v1/streetview?key=${key}&location=${lat},${lng}&heading=0&pitch=0&fov=90`;
  }
  // Fallback: Direct URL (braucht Cookie-Consent Handling)
  return `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`;
}

// Check if API key is configured
export function hasApiKey(): boolean {
  return API_CONFIG.GOOGLE_MAPS_API_KEY.length > 0;
}
