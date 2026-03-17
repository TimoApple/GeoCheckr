// GeoCheckr — Panorama Locations
// Using direct Google Maps Street View URLs (not short links) to avoid consent page

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
    lat: 50.49,
    lng: 30.54,
    panoramaUrl: 'https://www.google.com/maps/@50.4907805,30.5408708,3a,75y,8.18h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 203,
    city: 'Stornoway',
    country: 'Schottland',
    lat: 58.17,
    lng: -6.59,
    panoramaUrl: 'https://www.google.com/maps/@58.1721263,-6.5851039,3a,75y,180.53h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 204,
    city: 'Slutsk',
    country: 'Belarus',
    lat: 53.35,
    lng: 27.08,
    panoramaUrl: 'https://www.google.com/maps/@53.35,27.08,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 205,
    city: 'Lemvig',
    country: 'Dänemark',
    lat: 56.51,
    lng: 8.12,
    panoramaUrl: 'https://www.google.com/maps/@56.51,8.12,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 206,
    city: 'Brest',
    country: 'Belarus',
    lat: 52.74,
    lng: 24.18,
    panoramaUrl: 'https://www.google.com/maps/@52.74,24.18,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 207,
    city: 'Sizilien',
    country: 'Italien',
    lat: 36.79,
    lng: 14.68,
    panoramaUrl: 'https://www.google.com/maps/@36.7919954,14.6,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 208,
    city: 'Shetland',
    country: 'Schottland',
    lat: 60.83,
    lng: -0.78,
    panoramaUrl: 'https://www.google.com/maps/@60.83,-0.78,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 209,
    city: 'Cáceres',
    country: 'Spanien',
    lat: 39.04,
    lng: -6.15,
    panoramaUrl: 'https://www.google.com/maps/@39.04,-6.15,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 210,
    city: 'Nordfjordeid',
    country: 'Norwegen',
    lat: 61.83,
    lng: 6.12,
    panoramaUrl: 'https://www.google.com/maps/@61.83,6.12,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 211,
    city: 'Białystok',
    country: 'Polen',
    lat: 53.12,
    lng: 23.17,
    panoramaUrl: 'https://www.google.com/maps/@53.12,23.17,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
];
