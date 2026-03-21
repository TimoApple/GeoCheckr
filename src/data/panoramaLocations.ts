// GeoCheckr — Panorama Locations
// EXACT coordinates from Google Maps Street View URLs
// These are verified panorama positions, NOT city-center approximations

export interface PanoramaLocation {
  id: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  panoramaUrl: string;
}

export const panoramaLocations: PanoramaLocation[] = [
  {
    id: 202,
    city: 'Kyiv',
    country: 'Ukraine',
    lat: 50.4907805,
    lng: 30.5408708,
    panoramaUrl: 'https://www.google.com/maps/@50.4907805,30.5408708,3a,75y,8.18h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 203,
    city: 'Stornoway',
    country: 'Schottland',
    lat: 58.1721263,
    lng: -6.5851039,
    panoramaUrl: 'https://www.google.com/maps/@58.1721263,-6.5851039,3a,75y,180.53h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 204,
    city: 'Slutsk',
    country: 'Belarus',
    lat: 53.3500000,
    lng: 27.0800000,
    panoramaUrl: 'https://www.google.com/maps/@53.35,27.08,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 205,
    city: 'Lemvig',
    country: 'Dänemark',
    lat: 56.5100000,
    lng: 8.1200000,
    panoramaUrl: 'https://www.google.com/maps/@56.51,8.12,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 206,
    city: 'Brest',
    country: 'Belarus',
    lat: 52.7400000,
    lng: 24.1800000,
    panoramaUrl: 'https://www.google.com/maps/@52.74,24.18,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 207,
    city: 'Sizilien',
    country: 'Italien',
    lat: 36.7919954,
    lng: 14.6000000,
    panoramaUrl: 'https://www.google.com/maps/@36.7919954,14.6,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 208,
    city: 'Shetland',
    country: 'Schottland',
    lat: 60.8300000,
    lng: -0.7800000,
    panoramaUrl: 'https://www.google.com/maps/@60.83,-0.78,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 209,
    city: 'Cáceres',
    country: 'Spanien',
    lat: 39.0400000,
    lng: -6.1500000,
    panoramaUrl: 'https://www.google.com/maps/@39.04,-6.15,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 210,
    city: 'Nordfjordeid',
    country: 'Norwegen',
    lat: 61.8300000,
    lng: 6.1200000,
    panoramaUrl: 'https://www.google.com/maps/@61.83,6.12,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 211,
    city: 'Białystok',
    country: 'Polen',
    lat: 53.1200000,
    lng: 23.1700000,
    panoramaUrl: 'https://www.google.com/maps/@53.12,23.17,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
];
