package io.jongbeom.backend.service;

import io.jongbeom.backend.dto.DirectionsRequest;
import io.jongbeom.backend.dto.DirectionsResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * 카카오 모빌리티 API 서비스
 * 보행자 경로 안내 기능 제공
 */
@Service
public class KakaoMobilityService {

    private static final Logger logger = LoggerFactory.getLogger(KakaoMobilityService.class);
    private static final String KAKAO_API_URL = "https://apis-navi.kakaomobility.com/v1/directions";

    @Value("${kakao.mobility.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public KakaoMobilityService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * 보행자 경로 계산 (WALK)
     *
     * @param request 출발지, 도착지, 경유지 정보
     * @return 경로 정보 (거리, 시간, 좌표 배열)
     */
    public DirectionsResponse getWalkingRoute(DirectionsRequest request) {
        try {
            logger.info("[KakaoMobility] 보행자 경로 요청: {} -> {}", request.getStart(), request.getGoal());

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + apiKey);
            headers.set("Content-Type", "application/json");

            // URL 파라미터 구성
            String[] startCoords = request.getStart().split(",");
            String[] goalCoords = request.getGoal().split(",");

            StringBuilder urlBuilder = new StringBuilder(KAKAO_API_URL);
            urlBuilder.append("?origin=").append(startCoords[0]).append(",").append(startCoords[1]);
            urlBuilder.append("&destination=").append(goalCoords[0]).append(",").append(goalCoords[1]);

            // 경유지가 있는 경우
            if (request.getWaypoints() != null && !request.getWaypoints().isEmpty()) {
                StringBuilder waypointsParam = new StringBuilder();
                for (int i = 0; i < request.getWaypoints().size(); i++) {
                    if (i > 0) waypointsParam.append("|");
                    waypointsParam.append(request.getWaypoints().get(i));
                }
                urlBuilder.append("&waypoints=").append(waypointsParam.toString());
            }

            // 이동 수단 (foot: 도보)
            urlBuilder.append("&by=foot");

            // 경로 옵션 (RECOMMEND: 추천, SHORTEST: 최단거리)
            urlBuilder.append("&priority=RECOMMEND");

            String url = urlBuilder.toString();
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            logger.info("[KakaoMobility] 요청 URL: {}", url);
            logger.info("[KakaoMobility] 이동수단 파라미터 확인 - URL에 'by=foot' 포함 여부: {}", url.contains("by=foot"));

            // API 호출 (GET 방식)
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                (Class<Map<String, Object>>)(Class<?>)Map.class
            );

            logger.info("[KakaoMobility] 응답 상태 코드: {}", response.getStatusCode());

            // 응답 파싱
            Map<String, Object> body = response.getBody();
            if (body == null) {
                throw new RuntimeException("카카오 모빌리티 API 응답이 비어있습니다.");
            }

            return parseKakaoResponse(body);

        } catch (Exception e) {
            logger.error("[KakaoMobility] 경로 계산 실패", e);
            throw new RuntimeException("카카오 모빌리티 API 호출 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 카카오 API 응답을 DirectionsResponse로 변환
     */
    @SuppressWarnings("unchecked")
    private DirectionsResponse parseKakaoResponse(Map<String, Object> body) {
        try {
            // routes 배열에서 첫 번째 경로 가져오기
            List<Map<String, Object>> routes = (List<Map<String, Object>>) body.get("routes");
            if (routes == null || routes.isEmpty()) {
                throw new RuntimeException("경로를 찾을 수 없습니다.");
            }

            Map<String, Object> route = routes.get(0);
            Map<String, Object> summary = (Map<String, Object>) route.get("summary");

            // 거리 (미터)
            int distance = (Integer) summary.get("distance");

            // 소요 시간 (초)
            int duration = (Integer) summary.get("duration");

            // 경로 좌표 추출
            List<Map<String, Object>> sections = (List<Map<String, Object>>) route.get("sections");
            List<List<Double>> path = extractPathFromSections(sections);

            logger.info("[KakaoMobility] 경로 계산 성공 - 거리: {}m, 시간: {}초, 포인트: {}개",
                    distance, duration, path.size());

            return DirectionsResponse.builder()
                    .path(path)
                    .distance(distance)
                    .duration(duration)
                    .build();

        } catch (Exception e) {
            logger.error("[KakaoMobility] 응답 파싱 실패", e);
            throw new RuntimeException("카카오 응답 파싱 실패: " + e.getMessage(), e);
        }
    }

    /**
     * sections에서 경로 좌표 배열 추출
     */
    @SuppressWarnings("unchecked")
    private List<List<Double>> extractPathFromSections(List<Map<String, Object>> sections) {
        List<List<Double>> allPoints = new ArrayList<>();

        for (Map<String, Object> section : sections) {
            List<Map<String, Object>> roads = (List<Map<String, Object>>) section.get("roads");
            if (roads != null) {
                for (Map<String, Object> road : roads) {
                    List<Double> vertexes = (List<Double>) road.get("vertexes");
                    if (vertexes != null) {
                        // vertexes는 [x1, y1, x2, y2, ...] 형태 (일차원 배열)
                        for (int i = 0; i < vertexes.size(); i += 2) {
                            if (i + 1 < vertexes.size()) {
                                double lng = vertexes.get(i);
                                double lat = vertexes.get(i + 1);
                                allPoints.add(Arrays.asList(lng, lat));
                            }
                        }
                    }
                }
            }
        }

        return allPoints;
    }
}
