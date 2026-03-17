// GeoCheckr — Native Android Street View (uses Google Street View SDK, NOT WebView)
import React from 'react';
import { requireNativeComponent, ViewStyle, Platform } from 'react-native';

interface StreetViewNativeProps {
  location: { latitude: number; longitude: number };
  style?: ViewStyle;
}

// On Android, this maps to the native StreetViewPanoramaManager
const NativeStreetView = Platform.OS === 'android' 
  ? requireNativeComponent<StreetViewNativeProps>('StreetViewPanorama')
  : null;

interface NativeStreetViewProps {
  lat: number;
  lng: number;
  style?: ViewStyle;
}

export default function NativeStreetViewComponent({ lat, lng, style }: NativeStreetViewProps) {
  if (Platform.OS !== 'android' || !NativeStreetView) {
    return null;
  }

  return (
    <NativeStreetView
      location={{ latitude: lat, longitude: lng }}
      style={style || { flex: 1 }}
    />
  );
}
