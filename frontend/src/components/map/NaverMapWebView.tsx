import React, { useRef, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getNaverMapHtml, NAVER_CLIENT_ID } from './naverMapHtml';
import { getCurrentLocation } from '../../services/location';

const DEFAULT_LAT = 37.5666102;
const DEFAULT_LNG = 126.9783881;
const DEFAULT_ZOOM = 15;

interface NaverMapWebViewProps {
  clientId?: string;
  initialZoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onCameraChanged?: (lat: number, lng: number, zoom: number) => void;
  onInitialized?: () => void;
}

export default function NaverMapWebView({
  clientId = NAVER_CLIENT_ID,
  initialZoom = DEFAULT_ZOOM,
  onMapClick,
  onCameraChanged,
  onInitialized,
}: NaverMapWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation({ lat: location.latitude, lng: location.longitude });
      } catch (error) {
        console.warn('Failed to get current location, using default:', error);
        setCurrentLocation({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
      }
    };

    fetchLocation();
  }, []);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'initialized':
          setIsLoading(false);
          onInitialized?.();
          console.log('Naver Map initialized successfully');
          break;
        case 'mapClick':
          onMapClick?.(data.latitude, data.longitude);
          console.log('Map clicked:', data.latitude, data.longitude);
          break;
        case 'cameraChanged':
          onCameraChanged?.(data.latitude, data.longitude, data.zoom);
          console.log('Camera changed:', data.latitude, data.longitude, data.zoom);
          break;
        case 'debug':
          console.log('=== WebView Debug ===');
          console.log('Location:', data.location);
          console.log('Origin:', data.origin);
          console.log('Referrer:', data.referrer);
          break;
        case 'authError':
          console.log('=== Naver Map Auth Error ===');
          console.log('Code:', data.code);
          console.log('Message:', data.message);
          break;
      }
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  // Wait for location before rendering map
  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{
          html: getNaverMapHtml(clientId, currentLocation.lat, currentLocation.lng, initialZoom),
          baseUrl: 'http://10.0.2.2'
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#ffffff',
  },
});
