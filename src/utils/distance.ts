// GeoCheckr - Distance calculation utility
// Haversine formula for calculating distance between two coordinates

// Normalize city names for comparison (umlauts, special chars, whitespace)
export function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/é/g, 'e')
    .replace(/è/g, 'e')
    .replace(/ê/g, 'e')
    .replace(/á/g, 'a')
    .replace(/à/g, 'a')
    .replace(/â/g, 'a')
    .replace(/ñ/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ò/g, 'o')
    .replace(/ô/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ù/g, 'u')
    .replace(/û/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/\s+/g, ' ');
}

// City name aliases (German names, landmarks → canonical city names)
const CITY_ALIASES: Record<string, string> = {
  'peking': 'beijing',
  'mailand': 'milano',
  'florenz': 'firenze',
  'venedig': 'venezia',
  'neapel': 'napoli',
  'rom': 'roma',
  'genf': 'geneve',
  'bruessel': 'bruxelles',
  'den haag': 'the hague',
  'kopenhagen': 'copenhagen',
  'moskau': 'moscow',
  'st petersburg': 'saint petersburg',
  'sankt petersburg': 'saint petersburg',
  'bombay': 'mumbai',
  'kalkutta': 'kolkata',
  'kanton': 'guangzhou',
  'tokio': 'tokyo',
  'japan': 'tokyo',
  'china': 'beijing',
  'deutschland': 'berlin',
  'frankreich': 'paris',
  'italien': 'roma',
  'spanien': 'madrid',
  'grossbritannien': 'london',
  'tuerkei': 'istanbul',
  'griechenland': 'athen',
  'aegypten': 'kairo',
  'thailand': 'bangkok',
  'indien': 'delhi',
  'brasilien': 'sao paulo',
  'mexiko': 'mexiko stadt',
  'chinesische mauer': 'beijing',
  'grosse mauer': 'beijing',
  'great wall': 'beijing',
  'chinesisch': 'beijing',
  'mauer': 'beijing',
};

// Find location by city name (fuzzy match with normalization + aliases)
export function findLocationByCity(
  cityName: string,
  locations: Array<{ id: number; city: string; lat: number; lng: number }>
): { id: number; city: string; lat: number; lng: number } | undefined {
  const normalized = normalizeCityName(cityName);
  if (!normalized) return undefined;
  
  // Check aliases first
  const aliased = CITY_ALIASES[normalized];
  const searchTerm = aliased || normalized;
  
  // Exact normalized match
  for (const loc of locations) {
    if (normalizeCityName(loc.city) === searchTerm) {
      return loc;
    }
  }
  
  // Partial match (input contained in city or vice versa)
  for (const loc of locations) {
    const locNorm = normalizeCityName(loc.city);
    if (locNorm.includes(searchTerm) || searchTerm.includes(locNorm)) {
      return loc;
    }
  }
  
  return undefined;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Find closest city to a given location
export function findClosestCity(
  targetLat: number,
  targetLng: number,
  cities: Array<{ city: string; lat: number; lng: number }>
): { city: string; distance: number } {
  let closest = cities[0];
  let minDistance = calculateDistance(targetLat, targetLng, closest.lat, closest.lng);
  
  for (const city of cities) {
    const dist = calculateDistance(targetLat, targetLng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }
  
  return { city: closest.city, distance: minDistance };
}

// Calculate points based on distance
export function calculatePoints(distance: number): number {
  // Round to integer first (safety check)
  const dist = Math.round(distance);
  if (dist < 100) return 3; // Sehr nah
  if (dist < 500) return 2; // Nah
  if (dist < 2000) return 1; // Weit
  return 0; // Sehr weit
}

// Format distance for display (always integer km)
export function formatDistance(distance: number): string {
  const dist = Math.round(distance);
  return `${dist.toLocaleString('de-DE')} km`;
}
