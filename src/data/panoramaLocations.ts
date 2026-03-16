// GeoCheckr — Timo's 10 Panorama Locations
// These are the ONLY locations used in the game
// Each has a verified Google Maps panorama URL

export interface PanoramaLocation {
  id: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  panoramaUrl: string;
}

export const panoramaLocations: PanoramaLocation[] = [
  { id: 202, city: "Kyiv", country: "Ukraine", lat: 50.4908, lng: 30.5409, panoramaUrl: "https://maps.app.goo.gl/GhU6VpqhG67ECHbz8" },
  { id: 203, city: "Stornoway", country: "Schottland", lat: 58.1721, lng: -6.5851, panoramaUrl: "https://maps.app.goo.gl/w8oGzHCzHK8HYhto7" },
  { id: 204, city: "Slutsk", country: "Belarus", lat: 53.3455, lng: 27.0820, panoramaUrl: "https://maps.app.goo.gl/Tt6MvFP3Zz3bq8E77" },
  { id: 205, city: "Lemvig", country: "Dänemark", lat: 56.5099, lng: 8.1178, panoramaUrl: "https://maps.app.goo.gl/mgqsu9hUk75PXhQp6" },
  { id: 206, city: "Brest", country: "Belarus", lat: 52.7364, lng: 24.1751, panoramaUrl: "https://maps.app.goo.gl/jQcs81F9a1nwTFxU9" },
  { id: 207, city: "Sizilien", country: "Italien", lat: 36.7920, lng: 14.6826, panoramaUrl: "https://maps.app.goo.gl/E7KyGVUY4cZfArCQ9" },
  { id: 208, city: "Shetland", country: "Schottland", lat: 60.8292, lng: -0.7813, panoramaUrl: "https://maps.app.goo.gl/ijdHVErHMsMvqm7i8" },
  { id: 209, city: "Cáceres", country: "Spanien", lat: 39.0418, lng: -6.1478, panoramaUrl: "https://maps.app.goo.gl/Jq1bDBhoDaMGmUmf8" },
  { id: 210, city: "Nordfjordeid", country: "Norwegen", lat: 61.8310, lng: 6.1208, panoramaUrl: "https://maps.app.goo.gl/6Cv1bmaLgQucdwjN7" },
  { id: 211, city: "Białystok", country: "Polen", lat: 53.1195, lng: 23.1651, panoramaUrl: "https://maps.app.goo.gl/3hcqTxn5h8h6aqDd7" },
];
