
//ncpClientId 값 추후 DB로 이동하여 인증 후 사용방식으로
const NAVER_CLIENT_ID = 'gb25z9esgh'

export const naverMapHtml = `
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
    />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
      }
    </style>
    <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var mapOptions = {
        center: new naver.maps.LatLng(37.5666102, 126.9783881),
        zoom: 15
      };
      var map = new naver.maps.Map('map', mapOptions);
      var marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(37.5666102, 126.9783881),
        map: map
      });
      window._naverMap = map;
    </script>
  </body>
</html>
`;