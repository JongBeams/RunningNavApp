
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NaverMapView, Camera } from '@mj-studio/react-native-naver-map';

export default function NaverMapWebView() {
  const [loadStatus, setLoadStatus] = React.useState('지도 초기화 중...');

  // 서울시청 좌표
  const initialCamera: Camera = {
    latitude: 37.5666102,
    longitude: 126.9783881,
    zoom: 15,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.debugText}>{loadStatus}</Text>
      <NaverMapView
        style={styles.map}
        camera={initialCamera}
        isShowLocationButton={true}
        onCameraChanged={(event) => {
          console.log('Camera changed:', event);
        }}
        onMapClick={(event) => {
          console.log('Map clicked:', event.latitude, event.longitude);
        }}
        onInitialized={() => {
          setLoadStatus('지도 로드 완료!');
          console.log('Naver Map initialized successfully');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  debugText: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: 8,
    borderRadius: 4,
    fontSize: 12,
  },
});