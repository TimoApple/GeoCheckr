// GeoCheckr — Panorama Locations (50+ cities worldwide)
// Using direct Google Maps Street View URLs to avoid consent page
// Format: https://www.google.com/maps/@LAT,LNG,3a,75y,HEADINGh,90t/data=...

export interface PanoramaLocation {
  id: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  difficulty: 'leicht' | 'mittel' | 'schwer';
  region: string;
  panoramaUrl: string;
}

export const panoramaLocations: PanoramaLocation[] = [
  // ═══════════════════════════════════════════════════
  // EUROPA — Leicht (berühmte Städte, sofort erkennbar)
  // ═══════════════════════════════════════════════════
  {
    id: 1, city: 'Paris', country: 'Frankreich', lat: 48.8584, lng: 2.2945, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@48.8583701,2.2944813,3a,75y,280h,90t/data=!3m6!1e1!3m4!1sAF1QipNFcVHqwMUtзнаком!2e0!7i16384!8i8192'
  },
  {
    id: 2, city: 'London', country: 'UK', lat: 51.5007, lng: -0.1246, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@51.5007292,-0.1246254,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 3, city: 'Rom', country: 'Italien', lat: 41.8902, lng: 12.4922, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@41.8902102,12.4922309,3a,75y,90h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 4, city: 'Barcelona', country: 'Spanien', lat: 41.4036, lng: 2.1744, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@41.4036396,2.1743561,3a,75y,350h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 5, city: 'Amsterdam', country: 'Niederlande', lat: 52.3676, lng: 4.9041, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@52.3675734,4.9041387,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 6, city: 'Venedig', country: 'Italien', lat: 45.4408, lng: 12.3155, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@45.4408474,12.3155151,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 7, city: 'Wien', country: 'Österreich', lat: 48.2082, lng: 16.3738, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@48.2081743,16.3738189,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 8, city: 'Prag', country: 'Tschechien', lat: 50.0875, lng: 14.4213, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@50.0874576,14.4212535,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 9, city: 'München', country: 'Deutschland', lat: 48.1351, lng: 11.5820, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@48.1351253,11.5819805,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 10, city: 'Mailand', country: 'Italien', lat: 45.4642, lng: 9.1900, difficulty: 'leicht', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@45.4642035,9.189982,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // EUROPA — Mittel (erkennbar aber nicht trivial)
  // ═══════════════════════════════════════════════════
  {
    id: 11, city: 'Berlin', country: 'Deutschland', lat: 52.5163, lng: 13.3777, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@52.5162765,13.3777041,3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 12, city: 'Madrid', country: 'Spanien', lat: 40.4168, lng: -3.7038, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@40.4167754,-3.7037902,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 13, city: 'Stockholm', country: 'Schweden', lat: 59.3293, lng: 18.0686, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@59.3293235,18.0685808,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 14, city: 'Oslo', country: 'Norwegen', lat: 59.9139, lng: 10.7522, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@59.9138688,10.7522454,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 15, city: 'Kopenhagen', country: 'Dänemark', lat: 55.6761, lng: 12.5683, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@55.6760968,12.5683372,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 16, city: 'Helsinki', country: 'Finnland', lat: 60.1699, lng: 24.9384, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@60.1698557,24.938379,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 17, city: 'Dublin', country: 'Irland', lat: 53.3498, lng: -6.2603, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@53.3498053,-6.2603097,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 18, city: 'Lissabon', country: 'Portugal', lat: 38.7223, lng: -9.1393, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@38.7222524,-9.1393367,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 19, city: 'Brüssel', country: 'Belgien', lat: 50.8503, lng: 4.3517, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@50.8503396,4.3517103,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 20, city: 'Hamburg', country: 'Deutschland', lat: 53.5511, lng: 9.9937, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@53.5510846,9.9936818,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 21, city: 'Budapest', country: 'Ungarn', lat: 47.4979, lng: 19.0402, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@47.497912,19.040235,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 22, city: 'Warschau', country: 'Polen', lat: 52.2297, lng: 21.0122, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@52.2296756,21.0122287,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 23, city: 'Athen', country: 'Griechenland', lat: 37.9838, lng: 23.7275, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@37.9838096,23.7275388,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 24, city: 'Istanbul', country: 'Türkei', lat: 41.0082, lng: 28.9784, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@41.0082376,28.9783589,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 25, city: 'Zürich', country: 'Schweiz', lat: 47.3769, lng: 8.5417, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@47.3768866,8.5416945,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 26, city: 'Edinburgh', country: 'UK', lat: 55.9533, lng: -3.1883, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@55.953252,-3.188267,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 27, city: 'Florenz', country: 'Italien', lat: 43.7696, lng: 11.2558, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@43.7696129,11.2558136,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 28, city: 'Neapel', country: 'Italien', lat: 40.8518, lng: 14.2681, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@40.8517746,14.2681244,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 29, city: 'Lyon', country: 'Frankreich', lat: 45.7640, lng: 4.8357, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@45.764043,4.835659,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 30, city: 'Marseille', country: 'Frankreich', lat: 43.2965, lng: 5.3698, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@43.296482,5.36978,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // EUROPA — Schwer (kleinere/unkonventionelle Orte)
  // ═══════════════════════════════════════════════════
  {
    id: 31, city: 'Tallinn', country: 'Estland', lat: 59.4370, lng: 24.7536, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@59.4369608,24.7535747,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 32, city: 'Riga', country: 'Lettland', lat: 56.9496, lng: 24.1052, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@56.9496487,24.1051864,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 33, city: 'Reykjavik', country: 'Island', lat: 64.1466, lng: -21.9426, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@64.146582,-21.942583,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 34, city: 'Tromsø', country: 'Norwegen', lat: 69.6496, lng: 18.9560, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@69.649613,18.956047,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 35, city: 'Cáceres', country: 'Spanien', lat: 39.4752, lng: -6.3724, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@39.475246,-6.372407,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 36, city: 'Białystok', country: 'Polen', lat: 53.1325, lng: 23.1688, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@53.132488,23.168841,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 37, city: 'Brest', country: 'Belarus', lat: 52.0976, lng: 23.7341, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@52.097622,23.734051,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 38, city: 'Nordfjordeid', country: 'Norwegen', lat: 61.9123, lng: 5.9911, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@61.912278,5.991097,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 39, city: 'Lemvig', country: 'Dänemark', lat: 56.5466, lng: 8.3103, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@56.546637,8.310283,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 40, city: 'Sizilien (Agrigent)', country: 'Italien', lat: 37.3110, lng: 13.5765, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@37.310996,13.576508,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // ASIEN
  // ═══════════════════════════════════════════════════
  {
    id: 41, city: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@35.6761917,139.6503108,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 42, city: 'Seoul', country: 'Südkorea', lat: 37.5665, lng: 126.9780, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@37.566535,126.9779692,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 43, city: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@13.7563309,100.5017651,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 44, city: 'Singapur', country: 'Singapur', lat: 1.3521, lng: 103.8198, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@1.352083,103.819836,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 45, city: 'Dubai', country: 'VAE', lat: 25.1972, lng: 55.2744, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@25.197197,55.274376,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 46, city: 'Mumbai', country: 'Indien', lat: 19.0760, lng: 72.8777, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@19.0759837,72.8776559,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 47, city: 'Taipei', country: 'Taiwan', lat: 25.0330, lng: 121.5654, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@25.0339639,121.5644722,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 48, city: 'Hongkong', country: 'China', lat: 22.3193, lng: 114.1694, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@22.3193029,114.1693611,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 49, city: 'Kyoto', country: 'Japan', lat: 34.9859, lng: 135.7581, difficulty: 'schwer', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@34.985860,135.758096,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 50, city: 'Hanoi', country: 'Vietnam', lat: 21.0278, lng: 105.8342, difficulty: 'schwer', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@21.0277644,105.8341598,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // AFRIKA & NAHER OSTEN
  // ═══════════════════════════════════════════════════
  {
    id: 51, city: 'Kairo', country: 'Ägypten', lat: 30.0444, lng: 31.2357, difficulty: 'mittel', region: 'Afrika',
    panoramaUrl: 'https://www.google.com/maps/@30.0444196,31.2357116,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 52, city: 'Marrakesch', country: 'Marokko', lat: 31.6295, lng: -7.9811, difficulty: 'mittel', region: 'Afrika',
    panoramaUrl: 'https://www.google.com/maps/@31.629472,-7.981084,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 53, city: 'Kapstadt', country: 'Südafrika', lat: -33.9249, lng: 18.4241, difficulty: 'mittel', region: 'Afrika',
    panoramaUrl: 'https://www.google.com/maps/@-33.9248685,18.4240553,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 54, city: 'Nairobi', country: 'Kenia', lat: -1.2921, lng: 36.8219, difficulty: 'schwer', region: 'Afrika',
    panoramaUrl: 'https://www.google.com/maps/@-1.2920659,36.8219462,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 55, city: 'Jerusalem', country: 'Israel', lat: 31.7683, lng: 35.2137, difficulty: 'mittel', region: 'Asien',
    panoramaUrl: 'https://www.google.com/maps/@31.768319,35.21371,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // AMERIKA
  // ═══════════════════════════════════════════════════
  {
    id: 56, city: 'New York', country: 'USA', lat: 40.7580, lng: -73.9855, difficulty: 'leicht', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@40.757975,-73.985543,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 57, city: 'San Francisco', country: 'USA', lat: 37.8083, lng: -122.4194, difficulty: 'mittel', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@37.808289,-122.419415,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 58, city: 'Rio de Janeiro', country: 'Brasilien', lat: -22.9519, lng: -43.2105, difficulty: 'mittel', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@-22.951932,-43.210541,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 59, city: 'Buenos Aires', country: 'Argentinien', lat: -34.6037, lng: -58.3816, difficulty: 'mittel', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@-34.603684,-58.381559,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 60, city: 'Mexiko-Stadt', country: 'Mexiko', lat: 19.4326, lng: -99.1332, difficulty: 'mittel', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@19.4326077,-99.133208,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 61, city: 'Havanna', country: 'Kuba', lat: 23.1136, lng: -82.3666, difficulty: 'schwer', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@23.113599,-82.366596,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 62, city: 'Toronto', country: 'Kanada', lat: 43.6532, lng: -79.3832, difficulty: 'mittel', region: 'Amerika',
    panoramaUrl: 'https://www.google.com/maps/@43.653226,-79.3831843,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // OZEANIEN
  // ═══════════════════════════════════════════════════
  {
    id: 63, city: 'Sydney', country: 'Australien', lat: -33.8568, lng: 151.2153, difficulty: 'leicht', region: 'Ozeanien',
    panoramaUrl: 'https://www.google.com/maps/@-33.856784,151.215297,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 64, city: 'Melbourne', country: 'Australien', lat: -37.8136, lng: 144.9631, difficulty: 'mittel', region: 'Ozeanien',
    panoramaUrl: 'https://www.google.com/maps/@-37.8136276,144.9630576,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 65, city: 'Auckland', country: 'Neuseeland', lat: -36.8485, lng: 174.7633, difficulty: 'schwer', region: 'Ozeanien',
    panoramaUrl: 'https://www.google.com/maps/@-36.8484597,174.7633315,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },

  // ═══════════════════════════════════════════════════
  // EXTRA — Sonderlocations (Wahrzeichen, ungewöhnlich)
  // ═══════════════════════════════════════════════════
  {
    id: 66, city: 'Kyiv', country: 'Ukraine', lat: 50.4501, lng: 30.5234, difficulty: 'mittel', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@50.4501,30.5234,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 67, city: 'Stornoway', country: 'Schottland', lat: 58.2093, lng: -6.3890, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@58.2093,-6.3890,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
  {
    id: 68, city: 'Shetland', country: 'UK', lat: 60.3894, lng: -1.2618, difficulty: 'schwer', region: 'EU',
    panoramaUrl: 'https://www.google.com/maps/@60.3894,-1.2618,3a,75y,180h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192'
  },
];
