// GeoCheckr — Native Street View Module (launches Android StreetViewActivity)
import { NativeModules, Platform } from 'react-native';

const { StreetViewModule } = NativeModules;

export function openStreetView(lat: number, lng: number) {
  if (Platform.OS === 'android' && StreetViewModule) {
    StreetViewModule.openStreetView(lat, lng);
  }
}
