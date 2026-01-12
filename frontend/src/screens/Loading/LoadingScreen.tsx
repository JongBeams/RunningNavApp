import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';

// 앱 버전 정보
const APP_VERSION = '0.8.1';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.logo}>RunRun</Text>
        <ActivityIndicator size="large" color="#4A90D9" style={styles.spinner} />
        <Text style={styles.loadingText}>앱을 시작하는 중...</Text>
      </View>
      <Text style={styles.versionText}>v{APP_VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4A90D9',
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#888888',
  },
  versionText: {
    position: 'absolute',
    bottom: 30,
    fontSize: 12,
    color: '#AAAAAA',
    fontWeight: '500',
  },
});
