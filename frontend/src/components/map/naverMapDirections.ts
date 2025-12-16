// 네이버 클라우드 플랫폼 Client ID
export const NAVER_CLIENT_ID = 'gb25z9esgh';

export const getNaverMapDirectionsHtml = (
  clientId: string,
  lat: number,
  lng: number,
  zoom: number,
) => `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }
      #error-message {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        max-width: 80%;
        z-index: 1000;
        display: none;
      }
      #error-message.show {
        display: block;
      }
    </style>
    <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}"></script>
  </head>
  <body>
    <div id="map"></div>
    <div id="error-message">
      <h3 style="color: #e74c3c; margin-top: 0;">지도 로드 실패</h3>
      <p style="margin: 10px 0; color: #333;">네이버 Maps API 인증에 실패했습니다.</p>
      <p style="margin: 10px 0; font-size: 12px; color: #666;">클라이언트 ID를 확인해주세요.</p>
    </div>
    <script>
      var map;
      var markers = [];
      var polylines = [];
      var waypoints = [];

      // 지도 초기화
      try {
        var mapOptions = {
          center: new naver.maps.LatLng(${lat}, ${lng}),
          zoom: ${zoom},
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
          }
        };

        map = new naver.maps.Map('map', mapOptions);

        // 현재 위치 마커
        new naver.maps.Marker({
          position: new naver.maps.LatLng(${lat}, ${lng}),
          map: map,
          icon: {
            content: '<div style="width: 15px; height: 15px; background: #4A90D9; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            anchor: new naver.maps.Point(10, 10)
          }
        });

        // 인증 에러 감지
        naver.maps.Event.addListener(map, 'auth_fail', function(e) {
          document.getElementById('error-message').classList.add('show');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'authError',
            code: e.code,
            message: e.message
          }));
        });

        // 지도 클릭 이벤트
        naver.maps.Event.addListener(map, 'click', function(e) {
          var lat = e.coord.lat();
          var lng = e.coord.lng();

          // React Native로 클릭 좌표만 전송 (경유지 추가는 React Native에서 처리)
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            latitude: lat,
            longitude: lng
          }));
        });

        // 초기화 완료 알림
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'initialized'
        }));

      } catch (error) {
        console.error('Map initialization failed:', error);
        document.getElementById('error-message').classList.add('show');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: 'Map initialization failed: ' + error.message
        }));
      }

      // 경유지 추가 함수
      function addWaypoint(lat, lng) {
        // 5개 제한 체크
        if (waypoints.length >= 5) {
          console.warn('[WebView] 경유지는 최대 5개까지만 추가할 수 있습니다.');
          return;
        }

        var order = waypoints.length;
        var waypoint = {latitude: lat, longitude: lng, order: order};
        waypoints.push(waypoint);

        // 마커 추가 (push 후의 길이로 아이콘 생성)
        var marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(lat, lng),
          map: map,
          icon: {
            content: getMarkerIcon(order),
            anchor: new naver.maps.Point(15, 38)
          }
        });

        markers.push(marker);

        // 이전 마커들의 아이콘 업데이트 (출발/경유지/도착 구분)
        updateMarkerIcons();
      }

      // 마커 아이콘 생성 (출발, 경유지, 도착)
      function getMarkerIcon(order) {
        var totalWaypoints = waypoints.length;
        var bgColor = '#4A90D9'; // 경유지 색상
        var label = order + 1;

        if (order === 0) {
          // 출발지
          bgColor = '#00C73C';
          label = '출발';
        } else if (order === totalWaypoints - 1 && totalWaypoints > 1) {
          // 도착지
          bgColor = '#FF5A5F';
          label = '도착';
        }

        return '<div style="' +
          'background: ' + bgColor + ';' +
          'color: white;' +
          'border: 3px solid white;' +
          'border-radius: 20px;' +
          'padding: 6px 12px;' +
          'font-size: 12px;' +
          'font-weight: bold;' +
          'box-shadow: 0 2px 6px rgba(0,0,0,0.3);' +
          'white-space: nowrap;' +
          '">' + label + '</div>';
      }

      // 마지막 경유지 제거
      function removeLastWaypoint() {
        if (waypoints.length === 0) return;

        waypoints.pop();

        var lastMarker = markers.pop();
        if (lastMarker) {
          lastMarker.setMap(null);
        }

        // 이전 마커들의 아이콘 업데이트
        updateMarkerIcons();

        // 경로 제거 (React Native에서 재계산할 것임)
        clearRoute();

        // React Native에 경유지가 제거되었음을 알림 (경로 재계산 요청)
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'waypointRemoved',
          remainingCount: waypoints.length
        }));
      }

      // 모든 경유지 및 경로 제거
      function clearAll() {
        waypoints = [];

        markers.forEach(function(marker) {
          marker.setMap(null);
        });
        markers = [];

        clearRoute();
      }

      // 경로 제거
      function clearRoute() {
        polylines.forEach(function(polyline) {
          polyline.setMap(null);
        });
        polylines = [];
      }

      // 마커 아이콘 업데이트
      function updateMarkerIcons() {
        markers.forEach(function(marker, index) {
          marker.setIcon({
            content: getMarkerIcon(index),
            anchor: new naver.maps.Point(15, 38)
          });
        });
      }

      // Directions 5 API를 사용한 경로 계산
      function calculateRoute() {
        if (waypoints.length < 2) return;

        // 출발지와 도착지
        var start = waypoints[0].longitude + ',' + waypoints[0].latitude;
        var goal = waypoints[waypoints.length - 1].longitude + ',' + waypoints[waypoints.length - 1].latitude;

        // 경유지 (있는 경우)
        var waypointsParam = '';
        if (waypoints.length > 2) {
          var middlePoints = waypoints.slice(1, -1).map(function(wp) {
            return wp.longitude + ',' + wp.latitude;
          });
          waypointsParam = '&waypoints=' + middlePoints.join(':');
        }

        // Directions 5 API 호출
        var url = 'https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving' +
          '?start=' + start +
          '&goal=' + goal +
          waypointsParam +
          '&option=trafast'; // trafast: 실시간 빠른길

        // CORS 문제로 인해 React Native에서 API 호출을 처리해야 할 수 있음
        // 여기서는 간단한 직선 경로를 그립니다
        drawSimpleRoute();
      }

      // 간단한 직선 경로 그리기 (Directions API 대체용)
      function drawSimpleRoute() {
        clearRoute();

        if (waypoints.length < 2) return;

        var path = waypoints.map(function(wp) {
          return new naver.maps.LatLng(wp.latitude, wp.longitude);
        });

        var polyline = new naver.maps.Polyline({
          map: map,
          path: path,
          strokeColor: '#4A90D9',
          strokeWeight: 5,
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        });

        polylines.push(polyline);

        // 경로 거리 계산 (직선 거리)
        var totalDistance = 0;
        for (var i = 0; i < waypoints.length - 1; i++) {
          var from = new naver.maps.LatLng(waypoints[i].latitude, waypoints[i].longitude);
          var to = new naver.maps.LatLng(waypoints[i + 1].latitude, waypoints[i + 1].longitude);
          totalDistance += from.distanceTo(to);
        }

        // 예상 시간 계산 (평균 러닝 속도: 10 km/h = 2.78 m/s)
        var duration = Math.round(totalDistance / 2.78);

        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'routeCalculated',
          distance: Math.round(totalDistance),
          duration: duration
        }));

        // 지도 범위 조정
        var bounds = new naver.maps.LatLngBounds();
        waypoints.forEach(function(wp) {
          bounds.extend(new naver.maps.LatLng(wp.latitude, wp.longitude));
        });
        map.fitBounds(bounds, {padding: 50});
      }

      // React Native에서 메시지 수신
      document.addEventListener('message', function(e) {
        handleMessage(e.data);
      });

      window.addEventListener('message', function(e) {
        handleMessage(e.data);
      });

      function handleMessage(data) {
        try {
          var message = JSON.parse(data);

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
              // Directions API에서 받은 실제 도로 경로 그리기
              drawRealRoute(message.path);
              break;

            case 'calculateSimpleRoute':
              // API 호출 실패 시 직선 경로 그리기
              drawSimpleRoute();
              break;
          }
        } catch (error) {
          console.error('Message handling error:', error);
        }
      }

      // Directions API 경로 그리기
      function drawRealRoute(path) {
        clearRoute();

        if (!path || path.length < 2) return;

        // path는 [경도, 위도] 배열이므로 naver.maps.LatLng로 변환
        var pathLatLng = path.map(function(coord) {
          return new naver.maps.LatLng(coord[1], coord[0]); // [경도, 위도] -> LatLng(위도, 경도)
        });

        var polyline = new naver.maps.Polyline({
          map: map,
          path: pathLatLng,
          strokeColor: '#00C73C',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          strokeStyle: 'solid'
        });

        polylines.push(polyline);

        // 경로가 보이도록 지도 범위 조정
        var bounds = new naver.maps.LatLngBounds();
        pathLatLng.forEach(function(latlng) {
          bounds.extend(latlng);
        });
        map.fitBounds(bounds, {padding: 50});
      }

    </script>
  </body>
</html>
`;
