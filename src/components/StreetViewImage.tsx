// GeoCheckr — Street View Component
// Supports: 360° Panorama, Wikimedia images, regular images

import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Location } from '../types/location';
import Panorama360Viewer from './Panorama360Viewer';

interface StreetViewProps {
  location: Location;
  showInfo?: boolean; // Whether to show region info bar
}

/**
 * 360° Panorama URLs (Timos echte Daten + freie Quellen)
 */
const PANORAMA_360_URLS: Record<string, string> = {
  // Echte Daten von Timo
  "Kharg": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Kharg_Island_panorama.jpg",
};

/**
 * Wikimedia Commons image URLs for major cities
 * These are free to use (Creative Commons)
 */
// Street-view style images from Wikimedia (showing streets, exteriors, landmarks)
const WIKIMEDIA_IMAGES: Record<string, string> = {
  "Berlin": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Berlin_-_Unter_den_Linden_-_2013.jpg/800px-Berlin_-_Unter_den_Linden_-_2013.jpg",
  "London": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/London_Bridge_Station_London_Jan_2015.jpg/800px-London_Bridge_Station_London_Jan_2015.jpg",
  "Paris": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/600px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg",
  "Tokyo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Shibuya_Crossing_at_night_2.jpg/800px-Shibuya_Crossing_at_night_2.jpg",
  "New York": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabass.jpg/800px-New_york_times_square-terabass.jpg",
  "Rom": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Colosseum_in_Rome-April_2007-1-_copie_2B.jpg/800px-Colosseum_in_Rome-April_2007-1-_copie_2B.jpg",
  "Madrid": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Madrid_-_Edificio_de_Espa%C3%B1a_%282%29.jpg/600px-Madrid_-_Edificio_de_Espa%C3%B1a_%282%29.jpg",
  "Barcelona": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Barcelona_-_Sagrada_Fam%C3%ADlia_-_2016.jpg/600px-Barcelona_-_Sagrada_Fam%C3%ADlia_-_2016.jpg",
  "Amsterdam": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Amsterdam_-_Rijksmuseum_and_IAmsterdam_letters_-_panoramio.jpg/800px-Amsterdam_-_Rijksmuseum_and_IAmsterdam_letters_-_panoramio.jpg",
  "Wien": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Wien_-_Stephansdom_%282%29.JPG/600px-Wien_-_Stephansdom_%282%29.JPG",
  "Prag": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Prague_-_Charles_Bridge_at_night_2.jpg/800px-Prague_-_Charles_Bridge_at_night_2.jpg",
  "Sydney": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg/800px-Sydney_Opera_House_and_Harbour_Bridge_Dusk_%282%29_2019-06-21.jpg",
  "Kairo": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/All_Gizah_Pyramids.jpg/800px-All_Gizah_Pyramids.jpg",
  "Moskau": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Moscow_July_2011-16.jpg/800px-Moscow_July_2011-16.jpg",
  "Dubai": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/800px-Dubai_Marina_Skyline.jpg",
  "Singapur": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Singapore_skyline_at_blue_hour_-_Marina_Bay_Sands_%28cropped%29.jpg/800px-Singapore_skyline_at_blue_hour_-_Marina_Bay_Sands_%28cropped%29.jpg",
  "Mumbai": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Mumbai_Aug_2018_%2843397784544%29.jpg/800px-Mumbai_Aug_2018_%2843397784544%29.jpg",
  "Rio de Janeiro": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Panorama_of_Corcovado_mountain_and_Christ_the_Redeemer_statue_in_Rio_de_Janeiro.jpg/800px-Panorama_of_Corcovado_mountain_and_Christ_the_Redeemer_statue_in_Rio_de_Janeiro.jpg",
  "Istanbul": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Istanbul_%2832240576567%29.jpg/800px-Istanbul_%2832240576567%29.jpg",
  "Stockholm": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Stockholm-Storkyrkan_04.jpg/600px-Stockholm-Storkyrkan_04.jpg",
  "Hamburg": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Hamburg_Elbe_1.jpg/800px-Hamburg_Elbe_1.jpg",
  "München": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/M%C3%BCnchen_-_Marienplatz_-_Rathaus_und_Frauenkirche.jpg/800px-M%C3%BCnchen_-_Marienplatz_-_Rathaus_und_Frauenkirche.jpg",
  "Budapest": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Budapest_Corvin%C3%A1zok_2.jpg/800px-Budapest_Corvin%C3%Azok_2.jpg",
  "Athen": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Acropolis_of_Athens_01361.jpg/800px-Acropolis_of_Athens_01361.jpg",
  "Seoul": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Gyeongbokgung-Geunjeongjeon-Seoul.jpg/800px-Gyeongbokgung-Geunjeongjeon-Seoul.jpg",
  "Beijing": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Forbidden_City_Beijing_Shenwumen_Gate_2014.jpg/800px-Forbidden_City_Beijing_Shenwumen_Gate_2014.jpg",
  "Lissabon": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Lisbon_%2836831788636%29.jpg/800px-Lisbon_%2836831788636%29.jpg",
  "Kopenhagen": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Nyhavn_-_Copenhagen_-_Denmark.jpg/800px-Nyhavn_-_Copenhagen_-_Denmark.jpg",
  "Bangkok": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Wat_Arun_Ratchawararam_Bangkok_2015.jpg/600px-Wat_Arun_Ratchawararam_Bangkok_2015.jpg",
};

/**
 * Determine the best image source for a location
 */
function getImageInfo(location: Location): { url: string; is360: boolean } {
  // Check for custom Street View URL from Timo
  if (location.streetViewUrl && !location.isPlaceholder) {
    return { url: location.streetViewUrl, is360: false };
  }
  
  // Check for 360° panorama
  if (PANORAMA_360_URLS[location.city]) {
    return { url: PANORAMA_360_URLS[location.city], is360: true };
  }
  
  // Try Wikimedia
  if (WIKIMEDIA_IMAGES[location.city]) {
    return { url: WIKIMEDIA_IMAGES[location.city], is360: false };
  }
  
  // Fallback: Use Unsplash source for street-view style images
  const searchTerm = encodeURIComponent(`${location.city} street`);
  return { url: `https://source.unsplash.com/800x600/?${searchTerm},city,street`, is360: false };
}

/**
 * Street View Component for GeoCheckr
 * Supports 360° Panorama mode and regular images
 */
export default function StreetViewImage({ location, showInfo = false }: StreetViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState<'360' | 'flat'>('flat');
  const [imageInfo, setImageInfo] = useState<{ url: string; is360: boolean }>({ url: '', is360: false });

  useEffect(() => {
    const info = getImageInfo(location);
    setImageInfo(info);
    setViewMode(info.is360 ? '360' : 'flat');
    setLoading(true);
    setError(false);
  }, [location]);

  // 360° Panorama Mode
  if (viewMode === '360' && imageInfo.url) {
    return (
      <View style={styles.container}>
        <Panorama360Viewer imageUrl={imageInfo.url} locationName={location.city} />
        <TouchableOpacity 
          style={styles.toggle360}
          onPress={() => setViewMode('flat')}
        >
          <Text style={styles.toggle360Text}>📷 Normal</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Regular Image Mode
  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.loadingText}>Lade Bild...</Text>
        </View>
      )}
      
      <Image
        source={{ uri: imageInfo.url }}
        style={styles.image}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        resizeMode="cover"
      />
      
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorEmoji}>🌍</Text>
          <Text style={styles.errorText}>Bild konnte nicht geladen werden</Text>
          <Text style={styles.errorHint}>Studiere die Location-Daten!</Text>
        </View>
      )}
      
      {/* Region hint - only when showInfo is true */}
      {showInfo && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            📍 {location.region} • {location.continent}
          </Text>
          {imageInfo.is360 && (
            <TouchableOpacity 
              style={styles.switch360}
              onPress={() => setViewMode('360')}
            >
              <Text style={styles.switch360Text}>🔄 360°</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#16213e',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 10,
    fontSize: 14,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorHint: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
  },
  hintBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintText: {
    color: '#aaa',
    fontSize: 12,
  },
  toggle360: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 20,
  },
  toggle360Text: {
    color: '#fff',
    fontSize: 12,
  },
  switch360: {
    backgroundColor: '#e94560',
    padding: 6,
    borderRadius: 12,
  },
  switch360Text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});
