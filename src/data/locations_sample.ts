// GeoCheckr - Sample Location Database
// 200 Locations für Basisversion

export interface Location {
  id: number;
  city: string;
  country: string;
  region: string;
  continent: string;
  lat: number;
  lng: number;
  difficulty: 'leicht' | 'mittel' | 'schwer';
  qrCode: string;
  streetViewUrl?: string;
}

const locations: Location[] = [
  { id: 1, city: "Berlin", country: "Deutschland", region: "EU", continent: "EU", lat: 52.5200, lng: 13.4050, difficulty: "mittel", qrCode: "QR001" },
  { id: 2, city: "Tokyo", country: "Japan", region: "Asien", continent: "Asien", lat: 35.6762, lng: 139.6503, difficulty: "mittel", qrCode: "QR002" },
  { id: 3, city: "New York", country: "USA", region: "Nordamerika", continent: "Nordamerika", lat: 40.7128, lng: -74.0060, difficulty: "mittel", qrCode: "QR003" },
  { id: 4, city: "Sydney", country: "Australien", region: "Ozeanien", continent: "Ozeanien", lat: -33.8688, lng: 151.2093, difficulty: "mittel", qrCode: "QR004" },
  { id: 5, city: "Kairo", country: "Ägypten", region: "Afrika", continent: "Afrika", lat: 30.0444, lng: 31.2357, difficulty: "mittel", qrCode: "QR005" },
  { id: 6, city: "Rio de Janeiro", country: "Brasilien", region: "Südamerika", continent: "Südamerika", lat: -22.9068, lng: -43.1729, difficulty: "mittel", qrCode: "QR006" },
  { id: 7, city: "Mumbai", country: "Indien", region: "Asien", continent: "Asien", lat: 19.0760, lng: 72.8777, difficulty: "mittel", qrCode: "QR007" },
  { id: 8, city: "Moskau", country: "Russland", region: "EU", continent: "EU", lat: 55.7558, lng: 37.6173, difficulty: "mittel", qrCode: "QR008" },
  { id: 9, city: "Kapstadt", country: "Südafrika", region: "Afrika", continent: "Afrika", lat: -33.9249, lng: 18.4241, difficulty: "mittel", qrCode: "QR009" },
  { id: 10, city: "Mexiko-Stadt", country: "Mexiko", region: "Nordamerika", continent: "Nordamerika", lat: 19.4326, lng: -99.1332, difficulty: "mittel", qrCode: "QR010" },
  { id: 11, city: "Bangkok", country: "Thailand", region: "Asien", continent: "Asien", lat: 13.7563, lng: 100.5018, difficulty: "mittel", qrCode: "QR011" },
  { id: 12, city: "London", country: "UK", region: "EU", continent: "EU", lat: 51.5074, lng: -0.1278, difficulty: "mittel", qrCode: "QR012" },
  { id: 13, city: "Buenos Aires", country: "Argentinien", region: "Südamerika", continent: "Südamerika", lat: -34.6037, lng: -58.3816, difficulty: "mittel", qrCode: "QR013" },
  { id: 14, city: "Nairobi", country: "Kenya", region: "Afrika", continent: "Afrika", lat: -1.2921, lng: 36.8219, difficulty: "mittel", qrCode: "QR014" },
  { id: 15, city: "Reykjavik", country: "Island", region: "EU", continent: "EU", lat: 64.1466, lng: -21.9426, difficulty: "mittel", qrCode: "QR015" },
  // ... weitere 185 Locations aus der CSV
  // Für Prototyp: 50 reichen
];

export default locations;
