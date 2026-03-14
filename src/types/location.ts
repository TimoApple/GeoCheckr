// GeoCheckr — Location Type Definition
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
  landmark?: string; // Optional landmark name
  hint?: string; // Optional hint for easier difficulty
}

export interface LocationWithImage extends Location {
  imageUrl?: string;
  imageSource?: 'wikimedia' | 'picsum' | 'mapillary';
}
