
//ncpClientId 값 추후 DB로 이동하여 인증 후 사용방식으로

// 신규 API: 네이버 클라우드 플랫폼 (사용자가 발급받아야 함)
export const NAVER_CLIENT_ID = 'gb25z9esgh' // TODO: 네이버 클라우드 플랫폼에서 발급

// 테스트용: 구 API 사용 (localhost 등록 필요)
const USE_NEW_API = false;

export const getNaverMapHtml = (clientId: string, lat: number, lng: number, zoom: number) => `
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
      try {
        var mapOptions = {
          center: new naver.maps.LatLng(${lat}, ${lng}),
          zoom: ${zoom},
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
          }
        };

        var map = new naver.maps.Map('map', mapOptions);

        // 현재 위치 마커 추가
        var currentLocationMarker = new naver.maps.Marker({
          position: new naver.maps.LatLng(${lat}, ${lng}),
          map: map,
          icon: {
            content: '<div style="width: 15px; height: 15px; background: #4A90D9; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
            anchor: new naver.maps.Point(10, 10)
          }
        });

        // 인증 에러 감지
        naver.maps.Event.addListener(map, 'auth_fail', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'authError',
            code: e.code,
            message: e.message
          }));
        });

        // 지도 클릭 이벤트
        naver.maps.Event.addListener(map, 'click', function(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            latitude: e.coord.lat(),
            longitude: e.coord.lng()
          }));
        });

        // 카메라 변경 이벤트
        naver.maps.Event.addListener(map, 'idle', function() {
          var center = map.getCenter();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'cameraChanged',
            latitude: center.lat(),
            longitude: center.lng(),
            zoom: map.getZoom()
          }));
        });

        window._naverMap = map;
        console.log('Map loaded successfully');

        // 디버깅: 현재 URL과 Referer 확인
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'debug',
          location: window.location.href,
          origin: window.location.origin,
          referrer: document.referrer
        }));

        // 초기화 완료 알림
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'initialized'
        }));

      } catch (error) {
        console.error('Map initialization failed:', error);
        document.getElementById('error-message').classList.add('show');
      }
    </script>
  </body>
</html>
`;
