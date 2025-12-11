import React, {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import LoadingScreen from './screens/Loading/LoadingScreen';
import {
  ensureLocationPermission,
  openLocationSettings,
} from './services/location';
import {AuthProvider} from './context/AuthContext';

function App(): React.JSX.Element {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // 위치 권한 요청
      const hasPermission = await ensureLocationPermission();

      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide running navigation. Please enable it in settings.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => openLocationSettings()},
          ],
        );
      }

      // 최소 로딩 시간 (스플래시 효과)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsInitializing(false);
    };

    initApp();
  }, []);

  // AuthProvider 밖에서 초기 로딩 화면 표시
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // AuthProvider 내부에서 인증 상태 관리
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

export default App;
