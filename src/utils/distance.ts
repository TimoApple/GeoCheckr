// GeoCheckr - Distance calculation utility
// Haversine formula for calculating distance between two coordinates

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
  if (distance < 100) return 3; // Sehr nah
  if (distance < 500) return 2; // Nah
  if (distance < 2000) return 1; // Weit
  return 0; // Sehr weit
}
