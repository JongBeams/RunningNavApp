import React, {useRef, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {getKakaoMapDirectionsHtml, KAKAO_APP_KEY} from './kakaoMapDirections';
import {getCurrentLocation} from '../../services/location';

const DEFAULT_LAT = 37.5435; // 서울 광진구 광나루로40길 60 인근
const DEFAULT_LNG = 127.0947;
const DEFAULT_ZOOM = 4; // 약 50m 범위

interface KakaoMapWebViewProps {
  appKey?: string;
  initialZoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onInitialized?: () => void;
}

export default function KakaoMapWebView({
  appKey = KAKAO_APP_KEY,
  initialZoom = DEFAULT_ZOOM,
  onMapClick,
  onInitialized,
}: KakaoMapWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation({lat: location.latitude, lng: location.longitude});
      } catch (error) {
        console.warn('Failed to get current location, using default:', error);
        setCurrentLocation({lat: DEFAULT_LAT, lng: DEFAULT_LNG});
      }
    };

    fetchLocation();
  }, []);

  const handleMessage = (event: {nativeEvent: {data: string}}) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'initialized':
          setIsLoading(false);
          onInitialized?.();
          console.log('Kakao Map initialized successfully');
          break;
        case 'mapClick':
          onMapClick?.(data.latitude, data.longitude);
          console.log('Map clicked:', data.latitude, data.longitude);
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
          html: getKakaoMapDirectionsHtml(
            appKey,
            currentLocation.lat,
            currentLocation.lng,
            initialZoom,
          ),
          baseUrl: 'http://10.0.2.2',
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="compatibility"
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4A90D9" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});
