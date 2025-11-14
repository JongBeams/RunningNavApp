
//ncpClientId 값 추후 DB로 이동하여 인증 후 사용방식으로
// 구 API: AI NAVER API (종료 예정)
const NAVER_CLIENT_ID_OLD = 'gb25z9esgh'
// 신규 API: 네이버 클라우드 플랫폼 (사용자가 발급받아야 함)
const NAVER_CLIENT_ID_NEW = 'YOUR_NCP_CLIENT_ID' // TODO: 네이버 클라우드 플랫폼에서 발급

// 테스트용: 구 API 사용 (localhost 등록 필요)
const USE_NEW_API = false;

export const naverMapHtml = `
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
    <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${USE_NEW_API ? NAVER_CLIENT_ID_NEW : NAVER_CLIENT_ID_OLD}"></script>
  </head>
  <body>
    <div id="map"></div>
    <div id="error-message">
      <h3 style="color: #e74c3c; margin-top: 0;">지도 로드 실패</h3>
      <p style="margin: 10px 0; color: #333;">네이버 Maps API 인증에 실패했습니다.</p>
      <p style="margin: 10px 0; font-size: 12px; color: #666;">
        ${USE_NEW_API ? '신규 API 클라이언트 ID를 설정해주세요.' : 'localhost를 웹 서비스 URL로 등록해주세요.'}
      </p>
    </div>
    <script>
      try {
        var mapOptions = {
          center: new naver.maps.LatLng(37.5666102, 126.9783881),
          zoom: 15,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT
          }
        };

        var map = new naver.maps.Map('map', mapOptions);

        var marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(37.5666102, 126.9783881),
          map: map,
          title: '서울시청'
        });

        // 마커 클릭 이벤트
        naver.maps.Event.addListener(marker, 'click', function() {
          alert('서울시청 위치입니다.');
        });

        window._naverMap = map;
        console.log('Map loaded successfully');

      } catch (error) {
        console.error('Map initialization failed:', error);
        document.getElementById('error-message').classList.add('show');
      }
    </script>
  </body>
</html>
`;