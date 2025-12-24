/**
 * 카카오맵 WebView HTML 템플릿
 * 경유지 추가 및 경로 표시 기능 포함
 */

export const KAKAO_APP_KEY = 'e4d342b1a7ca7ec9cfd162164101abc4'; // 카카오 JavaScript 키

export const getKakaoMapDirectionsHtml = (
  appKey: string,
  latitude: number,
  longitude: number,
  zoom: number = 15,
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>카카오맵 경로 설정</title>
    <script type="text/javascript" src="//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}"></script>
    <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map;
        var waypoints = []; // 경유지 배열
        var markers = []; // 마커 배열
        var polyline = null; // 경로 폴리라인
        var currentLocationMarker = null; // 현재 위치 마커

        // 지도 초기화
        var mapContainer = document.getElementById('map');
        var mapOption = {
            center: new kakao.maps.LatLng(${latitude}, ${longitude}),
            level: ${zoom}
        };

        map = new kakao.maps.Map(mapContainer, mapOption);

        console.log('[KakaoMap] 지도 초기화 완료');

        // React Native로 초기화 완료 메시지 전송
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'initialized'
            }));
        }

        // 지도 클릭 이벤트
        kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
            var latlng = mouseEvent.latLng;
            var lat = latlng.getLat();
            var lng = latlng.getLng();

            console.log('[KakaoMap] 지도 클릭:', lat, lng);

            // React Native로 클릭 좌표 전송
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'mapClick',
                    latitude: lat,
                    longitude: lng
                }));
            }
        });

        /**
         * 경유지 추가
         */
        function addWaypoint(lat, lng) {
            if (waypoints.length >= 5) {
                console.warn('[KakaoMap] 경유지는 최대 5개까지만 추가할 수 있습니다.');
                return;
            }

            var position = new kakao.maps.LatLng(lat, lng);
            waypoints.push({ lat: lat, lng: lng });

            // 마커 생성
            var marker = new kakao.maps.Marker({
                position: position,
                map: map
            });

            // 마커 클릭 이벤트 추가
            kakao.maps.event.addListener(marker, 'click', function() {
                console.log('[KakaoMap] 마커 클릭:', lat, lng);

                // React Native로 마커 클릭 좌표 전송
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'markerClick',
                        latitude: lat,
                        longitude: lng
                    }));
                }
            });

            markers.push(marker);

            console.log('[KakaoMap] 경유지 추가:', lat, lng, '(총', waypoints.length, '개)');

            // 마커 아이콘 업데이트
            updateMarkerIcons();
        }

        /**
         * 마커 아이콘 업데이트 (출발, 경유, 도착 구분)
         */
        function updateMarkerIcons() {
            markers.forEach(function(marker, index) {
                var imageSrc, imageSize;

                if (index === 0) {
                    // 출발지 (빨간색 마커 : 출발이라 적혀있음)
                    imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png';
                    imageSize = new kakao.maps.Size(50, 45);
                } else if (index === waypoints.length - 1) {
                    // 도착지 (파란색 마커  : 도착이라 적혀있음)
                    imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png';
                    imageSize = new kakao.maps.Size(50, 45);
                } else {
                    // 경유지 (작은 빨간 마커)
                    imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png';
                    imageSize = new kakao.maps.Size(32, 35);
                }

                var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);
                marker.setImage(markerImage);
            });
        }

        /**
         * 마지막 경유지 삭제
         */
        function removeLastWaypoint() {
            if (waypoints.length === 0) {
                console.warn('[KakaoMap] 삭제할 경유지가 없습니다.');
                return;
            }

            // 마지막 마커 제거
            var lastMarker = markers.pop();
            lastMarker.setMap(null);

            // 마지막 경유지 제거
            waypoints.pop();

            console.log('[KakaoMap] 마지막 경유지 삭제 (남은 개수:', waypoints.length, ')');

            // 마커 아이콘 업데이트
            updateMarkerIcons();

            // 경로 다시 그리기 (2개 미만이면 삭제)
            if (waypoints.length < 2) {
                clearRoute();
            }

            // React Native로 삭제 완료 알림
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'waypointRemoved',
                    remainingCount: waypoints.length
                }));
            }
        }

        /**
         * 모든 경유지 및 마커 삭제
         */
        function clearAll() {
            // 모든 마커 제거
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            markers = [];
            waypoints = [];

            // 경로 제거
            clearRoute();

            console.log('[KakaoMap] 모든 경유지 삭제');
        }

        /**
         * 실제 도로 경로 그리기 (백엔드에서 받은 좌표 배열)
         */
        function drawRealRoute(path) {
            clearRoute();

            // path: [[lng, lat], [lng, lat], ...]
            var linePath = path.map(function(coord) {
                return new kakao.maps.LatLng(coord[1], coord[0]); // 카카오맵은 [lat, lng] 순서
            });

            polyline = new kakao.maps.Polyline({
                path: linePath,
                strokeWeight: 6,
                strokeColor: '#00C73C',
                strokeOpacity: 0.8,
                strokeStyle: 'solid'
            });

            polyline.setMap(map);

            console.log('[KakaoMap] 실제 도로 경로 그리기 완료 (포인트 개수:', path.length, ')');
        }

        /**
         * 직선 경로 그리기 (Fallback)
         */
        function calculateSimpleRoute() {
            clearRoute();

            if (waypoints.length < 2) {
                console.warn('[KakaoMap] 경유지가 2개 미만입니다.');
                return;
            }

            var linePath = waypoints.map(function(wp) {
                return new kakao.maps.LatLng(wp.lat, wp.lng);
            });

            polyline = new kakao.maps.Polyline({
                path: linePath,
                strokeWeight: 5,
                strokeColor: '#FF6B6B',
                strokeOpacity: 0.7,
                strokeStyle: 'dashed'
            });

            polyline.setMap(map);

            console.log('[KakaoMap] 직선 경로 그리기 완료');
        }

        /**
         * 경로 삭제
         */
        function clearRoute() {
            if (polyline) {
                polyline.setMap(null);
                polyline = null;
            }
        }

        /**
         * 출발지/도착지 마커 표시
         */
        function showStartEndMarkers(startLat, startLng, endLat, endLng) {
            // 기존 마커 모두 제거
            markers.forEach(function(marker) {
                marker.setMap(null);
            });
            markers = [];
            waypoints = [];

            // 출발지 마커 추가
            var startPosition = new kakao.maps.LatLng(startLat, startLng);
            var startMarker = new kakao.maps.Marker({
                position: startPosition,
                map: map,
                image: new kakao.maps.MarkerImage(
                    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/red_b.png',
                    new kakao.maps.Size(50, 45)
                )
            });
            markers.push(startMarker);

            // 도착지 마커 추가
            var endPosition = new kakao.maps.LatLng(endLat, endLng);
            var endMarker = new kakao.maps.Marker({
                position: endPosition,
                map: map,
                image: new kakao.maps.MarkerImage(
                    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/blue_b.png',
                    new kakao.maps.Size(50, 45)
                )
            });
            markers.push(endMarker);

            console.log('[KakaoMap] 출발/도착 마커 표시 완료');
        }

        /**
         * 현재 위치 마커 표시
         */
        function showCurrentLocation(lat, lng) {
            // 기존 현재 위치 마커 제거
            if (currentLocationMarker) {
                currentLocationMarker.setMap(null);
            }

            var position = new kakao.maps.LatLng(lat, lng);

            // 현재 위치 마커 생성 (별 모양 - 노란색)
            currentLocationMarker = new kakao.maps.Marker({
                position: position,
                map: map,
                image: new kakao.maps.MarkerImage(
                    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                    new kakao.maps.Size(24, 35)
                )
            });

            console.log('[KakaoMap] 현재 위치 마커 표시:', lat, lng);
        }

        /**
         * React Native로부터 메시지 수신
         */
        document.addEventListener('message', function(event) {
            handleMessage(event.data);
        });

        window.addEventListener('message', function(event) {
            handleMessage(event.data);
        });

        function handleMessage(data) {
            try {
                var message = JSON.parse(data);
                console.log('[KakaoMap] 메시지 수신:', message.type);

                switch (message.type) {
                    case 'addWaypoint':
                        addWaypoint(message.waypoint.latitude, message.waypoint.longitude);
                        break;

                    case 'removeLastWaypoint':
                        removeLastWaypoint();
                        break;

                    case 'clearAll':
                        clearAll();
                        break;

                    case 'drawRoute':
                        // 실제 도로 경로 그리기
                        drawRealRoute(message.path);
                        break;

                    case 'showStartEndMarkers':
                        // 출발/도착 마커 표시
                        showStartEndMarkers(
                            message.startLat,
                            message.startLng,
                            message.endLat,
                            message.endLng
                        );
                        break;

                    case 'showCurrentLocation':
                        // 현재 위치 마커 표시
                        showCurrentLocation(message.lat, message.lng);
                        break;

                    case 'calculateSimpleRoute':
                        // 직선 경로 그리기
                        calculateSimpleRoute();
                        break;

                    default:
                        console.warn('[KakaoMap] 알 수 없는 메시지 타입:', message.type);
                }
            } catch (error) {
                console.error('[KakaoMap] 메시지 파싱 에러:', error);
            }
        }

        console.log('[KakaoMap] 스크립트 로드 완료');
    </script>
</body>
</html>
  `.trim();
};
