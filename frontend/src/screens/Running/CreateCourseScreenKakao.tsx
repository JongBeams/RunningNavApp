import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../../types/navigation';
import {colors, spacing, fontSize, commonStyles} from '../../styles';
import {
  getKakaoMapDirectionsHtml,
  KAKAO_APP_KEY,
} from '../../components/map/kakaoMapDirections';
import {
  createCourse,
  waypointsToGeoJson,
  waypointsToLineString,
} from '../../services/api/courseApi';
import {getTmapRouteBetweenPoints} from '../../services/api/tmapPedestrianApi';

type CreateCourseScreenNav = NativeStackNavigationProp<
  RootStackParamList,
  'CreateCourse'
>;

interface Waypoint {
  latitude: number;
  longitude: number;
  order: number;
}

interface RouteInfo {
  distance: number; // 미터
  duration: number; // 초
}

export default function CreateCourseScreenKakao() {
  const navigation = useNavigation<CreateCourseScreenNav>();
  const webViewRef = useRef<WebView>(null);

  const [courseName, setCourseName] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 37.5435, // 서울 광진구 광나루로40길 60 인근
    longitude: 127.0947,
  });

  /**
   * 두 지점 간 직선 거리 계산 (Haversine formula)
   */
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
  };

  /**
   * 경유지 배열을 기준으로 직선 경로의 총 거리 및 예상 시간 계산
   */
  const calculateStraightRoute = (
    points: Waypoint[],
  ): {distance: number; duration: number} => {
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const dist = calculateDistance(
        points[i].latitude,
        points[i].longitude,
        points[i + 1].latitude,
        points[i + 1].longitude,
      );
      totalDistance += dist;
    }

    // 예상 시간 계산 (평균 러닝 속도: 6분/km = 10km/h = 2.78m/s)
    const runningSpeed = 2.78; // m/s
    const duration = Math.round(totalDistance / runningSpeed);

    return {
      distance: Math.round(totalDistance),
      duration,
    };
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'mapClick':
          // 지도 클릭 시 경유지 추가
          handleAddWaypoint(data.latitude, data.longitude);
          break;

        case 'markerClick':
          // 마커 클릭 시 해당 위치를 다음 도착지로 설정
          handleAddWaypoint(data.latitude, data.longitude);
          break;

        case 'waypointRemoved':
          // WebView에서 경유지 제거 완료 -> 경로 재계산
          if (data.remainingCount >= 2) {
            recalculateRoute();
          } else {
            setRouteInfo(null);
          }
          break;

        case 'routeCalculated':
          // 경로 계산 완료
          setRouteInfo({
            distance: data.distance,
            duration: data.duration,
          });
          break;

        case 'initialized':
          console.log('Kakao Map initialized');
          break;

        case 'error':
          console.error('Map error:', data.message);
          Alert.alert('오류', data.message);
          break;
      }
    } catch (error) {
      console.error('WebView message parsing error:', error);
    }
  };

  const handleAddWaypoint = async (latitude: number, longitude: number) => {
    // 경유지 5개 제한 (출발지 포함)
    if (waypoints.length >= 5) {
      Alert.alert('알림', '경유지는 최대 5개까지만 추가할 수 있습니다.');
      return;
    }

    const newWaypoint: Waypoint = {
      latitude,
      longitude,
      order: waypoints.length,
    };

    const updatedWaypoints = [...waypoints, newWaypoint];
    setWaypoints(updatedWaypoints);

    // WebView에 경유지 추가 명령 전송 (마커만 표시)
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'addWaypoint',
          waypoint: newWaypoint,
        }),
      );
    }

    // 경유지가 2개 이상이면 카카오 모빌리티 API로 보행자 경로 계산
    if (updatedWaypoints.length >= 2) {
      try {
        // 전체 경유지를 기준으로 경로 계산
        const start = updatedWaypoints[0];
        const goal = updatedWaypoints[updatedWaypoints.length - 1];
        const middlePoints =
          updatedWaypoints.length > 2
            ? updatedWaypoints.slice(1, -1).map(wp => ({
                lat: wp.latitude,
                lng: wp.longitude,
              }))
            : undefined;

        const routeData = await getTmapRouteBetweenPoints(
          start.latitude,
          start.longitude,
          goal.latitude,
          goal.longitude,
          middlePoints,
        );

        // 경로 정보 업데이트
        setRouteInfo({
          distance: routeData.distance,
          duration: routeData.duration,
        });

        // WebView에 실제 보행자 경로 전송
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'drawRoute',
              path: routeData.path,
              distance: routeData.distance,
              duration: routeData.duration,
            }),
          );
        }
      } catch (error) {
        console.error('[CreateCourse] 경로 계산 실패:', error);
        Alert.alert('오류', '경로를 계산할 수 없습니다. 직선으로 표시됩니다.');

        // 실패 시 WebView에서 직선으로 그리도록 메시지 전송
        if (webViewRef.current) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: 'calculateSimpleRoute',
            }),
          );
        }
      }
    }
  };

  const recalculateRoute = async () => {
    if (waypoints.length < 2) {
      setRouteInfo(null);
      return;
    }

    try {
      const start = waypoints[0];
      const goal = waypoints[waypoints.length - 1];
      const middlePoints =
        waypoints.length > 2
          ? waypoints.slice(1, -1).map(wp => ({
              lat: wp.latitude,
              lng: wp.longitude,
            }))
          : undefined;

      const routeData = await getTmapRouteBetweenPoints(
        start.latitude,
        start.longitude,
        goal.latitude,
        goal.longitude,
        middlePoints,
      );

      setRouteInfo({
        distance: routeData.distance,
        duration: routeData.duration,
      });

      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'drawRoute',
            path: routeData.path,
            distance: routeData.distance,
            duration: routeData.duration,
          }),
        );
      }
    } catch (error) {
      console.error('[CreateCourse] 경로 재계산 실패:', error);

      if (webViewRef.current) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: 'calculateSimpleRoute',
          }),
        );
      }
    }
  };

  const handleRemoveLastWaypoint = () => {
    if (waypoints.length === 0) {
      Alert.alert('알림', '삭제할 경유지가 없습니다.');
      return;
    }

    setWaypoints(prev => prev.slice(0, -1));

    // WebView에 마지막 경유지 제거 명령 전송
    if (webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          type: 'removeLastWaypoint',
        }),
      );
    }
  };

  const handleClearAll = () => {
    Alert.alert('초기화', '모든 경유지를 삭제하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: () => {
          setWaypoints([]);
          setRouteInfo(null);

          if (webViewRef.current) {
            webViewRef.current.postMessage(
              JSON.stringify({
                type: 'clearAll',
              }),
            );
          }
        },
      },
    ]);
  };

  const handleSaveCourse = async () => {
    if (!courseName.trim()) {
      Alert.alert('알림', '코스 이름을 입력해주세요.');
      return;
    }

    if (waypoints.length < 2) {
      Alert.alert('알림', '최소 2개 이상의 지점을 선택해주세요.');
      return;
    }

    if (!routeInfo) {
      Alert.alert('알림', '경로 정보를 계산할 수 없습니다.');
      return;
    }

    try {
      // 경유지를 GeoJSON 형식으로 변환
      const waypointsGeoJson = waypointsToGeoJson(waypoints);
      const routeGeoJson = waypointsToLineString(waypoints);

      await createCourse({
        name: courseName,
        routeGeoJson,
        waypointsGeoJson,
        distance: routeInfo.distance,
        duration: routeInfo.duration,
      });

      Alert.alert('성공', '코스가 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('[CreateCourse] 코스 저장 실패:', error);
      Alert.alert('오류', '코스 저장에 실패했습니다.');
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters.toFixed(0)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}분 ${secs}초`;
  };

  return (
    <View style={commonStyles.container}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>코스 만들기 (카카오맵)</Text>
        <TouchableOpacity onPress={handleSaveCourse}>
          <Text style={styles.saveButton}>저장</Text>
        </TouchableOpacity>
      </View>

      {/* 코스 이름 입력 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="코스 이름을 입력하세요"
          value={courseName}
          onChangeText={setCourseName}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{
            html: getKakaoMapDirectionsHtml(
              KAKAO_APP_KEY,
              currentLocation.latitude,
              currentLocation.longitude,
              4, // 약 50m 범위
            ),
            baseUrl: 'http://10.0.2.2',
          }}
          onMessage={handleWebViewMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="compatibility"
          style={styles.webView}
        />
      </View>

      {/* 하단 정보 및 버튼 */}
      <View style={styles.bottomContainer}>
        {/* 경로 정보 */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>경유지</Text>
            <Text style={styles.infoValue}>{waypoints.length}개</Text>
          </View>
          {routeInfo && (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>거리</Text>
                <Text style={styles.infoValue}>
                  {formatDistance(routeInfo.distance)}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>예상시간</Text>
                <Text style={styles.infoValue}>
                  {formatDuration(routeInfo.duration)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.removeButton]}
            onPress={handleRemoveLastWaypoint}>
            <Text style={styles.buttonText}>마지막 지점 삭제</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClearAll}>
            <Text style={styles.buttonText}>전체 초기화</Text>
          </TouchableOpacity>
        </View>

        {/* 안내 메시지 */}
        <Text style={styles.hintText}>
          지도를 터치하여 경유지를 추가하세요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  saveButton: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.backgroundDark,
  },
  webView: {
    flex: 1,
  },
  bottomContainer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: colors.textSecondary,
  },
  clearButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  hintText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
  },
});
