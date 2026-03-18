// GeoCheckr — Native Street View Module (launches Android StreetViewActivity)
import { NativeModules, Platform, Alert } from 'react-native';

const { StreetViewModule } = NativeModules;

export function openStreetView(lat: number, lng: number) {
  if (Platform.OS === 'android' && StreetViewModule) {
    try {
      StreetViewModule.openStreetView(lat, lng);
    } catch (e) {
      console.warn('StreetView failed to open:', e);
    }
  }
}
