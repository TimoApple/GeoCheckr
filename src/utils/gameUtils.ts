// GeoCheckr - Game Utilities
// Haversine distance, scoring, location selection

import { Location } from '../data/locations';

/**
 * Haversine distance between two coordinates in kilometers
 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate score based on distance
 * Max 1000 points, drops with distance
 * - 0-50km: 1000 pts
 * - 50-200km: 800 pts
 * - 200-500km: 600 pts
 * - 500-1000km: 400 pts
 * - 1000-2000km: 200 pts
 * - 2000-5000km: 100 pts
 * - 5000+km: 50 pts
 */
export function calculateScore(distanceKm: number): number {
  if (distanceKm <= 50) return 1000;
  if (distanceKm <= 200) return 800;
  if (distanceKm <= 500) return 600;
  if (distanceKm <= 1000) return 400;
  if (distanceKm <= 2000) return 200;
  if (distanceKm <= 5000) return 100;
  return 50;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)}km`;
  return `${Math.round(distanceKm)}km`;
}

/**
 * Get random locations for a round
 * Ensures geographic diversity (different continents)
 */
export function getRandomLocations(allLocations: Location[], count: number): Location[] {
  const shuffled = [...allLocations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get distractor cities for multiple choice
 * Returns cities that are geographically spread out
 */
export function getDistractors(
  correctLocation: Location,
  allLocations: Location[],
  count: number = 3
): Location[] {
  const others = allLocations.filter(l => l.id !== correctLocation.id);
  
  // Sort by distance, pick from different zones
  const sorted = others.map(l => ({
    location: l,
    distance: haversineDistance(correctLocation.lat, correctLocation.lng, l.lat, l.lng),
  })).sort((a, b) => a.distance - b.distance);
  
  // Mix: 1 close, 1 medium, 1 far
  const close = sorted.filter(s => s.distance < 1000).slice(0, 1);
  const medium = sorted.filter(s => s.distance >= 1000 && s.distance < 5000).slice(0, 1);
  const far = sorted.filter(s => s.distance >= 5000).slice(0, 1);
  
  const selected = [...close, ...medium, ...far].map(s => s.location);
  
  // Fill up if needed
  while (selected.length < count && selected.length < others.length) {
    const remaining = others.filter(l => !selected.find(s => s.id === l.id));
    if (remaining.length === 0) break;
    selected.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }
  
  return selected.slice(0, count);
}

/**
 * Get Street View URL for a location
 */
export function getStreetViewUrl(location: Location): string {
  return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${location.lat},${location.lng}&fov=90&heading=${Math.random() * 360}&pitch=0&key=YOUR_API_KEY`;
}

/**
 * Static map fallback (no API key needed for preview)
 */
export function getStaticMapUrl(location: Location): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=800x600&markers=color:red%7C${location.lat},${location.lng}&key=YOUR_API_KEY`;
}
