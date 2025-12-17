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
  centerLat?: number; // 지도 중심 위도
  centerLng?: number; // 지도 중심 경도
  routePath?: number[][]; // 경로 좌표 배열 [[lng, lat], ...]
  startLat?: number; // 출발지 위도
  startLng?: number; // 출발지 경도
  endLat?: number; // 도착지 위도
  endLng?: number; // 도착지 경도
  showCurrentLocation?: boolean; // 현재 위치 표시 여부
  onMapClick?: (lat: number, lng: number) => void;
  onInitialized?: () => void;
}

export default function KakaoMapWebView({
  appKey = KAKAO_APP_KEY,
  initialZoom = DEFAULT_ZOOM,
  centerLat,
  centerLng,
  routePath,
  startLat,
  startLng,
  endLat,
  endLng,
  showCurrentLocation = false,
  onMapClick,
  onInitialized,
}: KakaoMapWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    const fetchLocation = async () => {
      // 실제 사용자 위치 가져오기
      try {
        const location = await getCurrentLocation();
        const userLoc = {lat: location.latitude, lng: location.longitude};
        setUserLocation(userLoc);

        // centerLat, centerLng가 제공되면 지도 중심으로 사용
        if (centerLat !== undefined && centerLng !== undefined) {
          setCurrentLocation({lat: centerLat, lng: centerLng});
        } else {
          // 중심 좌표가 없으면 사용자 위치를 중심으로
          setCurrentLocation(userLoc);
        }
      } catch (error) {
        console.warn('Failed to get current location, using default:', error);
        const defaultLoc = {lat: DEFAULT_LAT, lng: DEFAULT_LNG};
        setUserLocation(defaultLoc);

        if (centerLat !== undefined && centerLng !== undefined) {
          setCurrentLocation({lat: centerLat, lng: centerLng});
        } else {
          setCurrentLocation(defaultLoc);
        }
      }
    };

    fetchLocation();
  }, [centerLat, centerLng]);

  // 경로가 변경되면 WebView에 전달
  useEffect(() => {
    if (routePath && routePath.length > 0 && webViewRef.current && !isLoading) {
      console.log('[KakaoMapWebView] 경로 표시:', routePath.length, '개 좌표');
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'drawRoute',
          path: routePath,
        }),
      );
    }
  }, [routePath, isLoading]);

  // 출발/도착 마커 표시
  useEffect(() => {
    if (
      startLat !== undefined &&
      startLng !== undefined &&
      endLat !== undefined &&
      endLng !== undefined &&
      webViewRef.current &&
      !isLoading
    ) {
      console.log('[KakaoMapWebView] 출발/도착 마커 표시');
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'showStartEndMarkers',
          startLat,
          startLng,
          endLat,
          endLng,
        }),
      );
    }
  }, [startLat, startLng, endLat, endLng, isLoading]);

  // 현재 위치 마커 표시
  useEffect(() => {
    if (
      showCurrentLocation &&
      userLocation &&
      webViewRef.current &&
      !isLoading
    ) {
      console.log('[KakaoMapWebView] 현재 위치 마커 표시');
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'showCurrentLocation',
          lat: userLocation.lat,
          lng: userLocation.lng,
        }),
      );
    }
  }, [showCurrentLocation, userLocation, isLoading]);

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
