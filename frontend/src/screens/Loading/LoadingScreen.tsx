import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>RunRun</Text>
      <ActivityIndicator size="large" color="#4A90D9" style={styles.spinner} />
      <Text style={styles.loadingText}>Loading...</Text>
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
});
