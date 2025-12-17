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
 * TMAP 보행자 경로 API 서비스
 * 보행자 전용 경로 안내 기능 제공
 */
@Service
public class TmapPedestrianService {

    private static final Logger logger = LoggerFactory.getLogger(TmapPedestrianService.class);
    private static final String TMAP_PEDESTRIAN_API_URL = "https://apis.openapi.sk.com/tmap/routes/pedestrian";

    @Value("${tmap.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public TmapPedestrianService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * 보행자 경로 계산
     *
     * @param request 출발지, 도착지, 경유지 정보
     * @return 경로 정보 (거리, 시간, 좌표 배열)
     */
    public DirectionsResponse getPedestrianRoute(DirectionsRequest request) {
        try {
            logger.info("[TMAP] 보행자 경로 요청: {} -> {}", request.getStart(), request.getGoal());

            // 좌표 파싱
            String[] startCoords = request.getStart().split(",");
            String[] goalCoords = request.getGoal().split(",");

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("appKey", apiKey);
            headers.set("Content-Type", "application/json");
            headers.set("Accept", "application/json");

            logger.info("[TMAP] API 키 (처음 10자): {}...", apiKey != null && apiKey.length() > 10 ? apiKey.substring(0, 10) : "null");

            // 경유지가 있는 경우
            if (request.getWaypoints() != null && !request.getWaypoints().isEmpty()) {
                // 경유지가 있으면 구간별로 나누어서 경로 계산
                return calculateRouteWithWaypoints(startCoords, goalCoords, request.getWaypoints(), headers);
            } else {
                // 경유지 없이 직접 경로 계산
                return calculateDirectRoute(startCoords, goalCoords, headers);
            }

        } catch (Exception e) {
            logger.error("[TMAP] 경로 계산 실패", e);
            throw new RuntimeException("TMAP API 호출 실패: " + e.getMessage(), e);
        }
    }

    /**
     * 직접 경로 계산 (경유지 없음)
     */
    private DirectionsResponse calculateDirectRoute(String[] startCoords, String[] goalCoords, HttpHeaders headers) {
        // 요청 바디 구성
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("startX", Double.parseDouble(startCoords[0])); // 경도
        requestBody.put("startY", Double.parseDouble(startCoords[1])); // 위도
        requestBody.put("endX", Double.parseDouble(goalCoords[0])); // 경도
        requestBody.put("endY", Double.parseDouble(goalCoords[1])); // 위도
        requestBody.put("startName", "출발지");
        requestBody.put("endName", "도착지");

        String url = TMAP_PEDESTRIAN_API_URL + "?version=1";

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        logger.info("[TMAP] 요청 URL: {}", url);
        logger.info("[TMAP] 요청 바디: startX={}, startY={}, endX={}, endY={}",
                requestBody.get("startX"), requestBody.get("startY"),
                requestBody.get("endX"), requestBody.get("endY"));

        // API 호출 (POST 방식)
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                (Class<Map<String, Object>>)(Class<?>)Map.class
        );

        logger.info("[TMAP] 응답 상태 코드: {}", response.getStatusCode());

        // 응답 파싱
        Map<String, Object> body = response.getBody();
        if (body == null) {
            throw new RuntimeException("TMAP API 응답이 비어있습니다.");
        }

        return parseTmapResponse(body);
    }

    /**
     * 경유지가 있는 경우 구간별 경로 계산 후 병합
     */
    @SuppressWarnings("unchecked")
    private DirectionsResponse calculateRouteWithWaypoints(
            String[] startCoords,
            String[] goalCoords,
            List<String> waypoints,
            HttpHeaders headers) {

        List<List<Double>> totalPath = new ArrayList<>();
        int totalDistance = 0;
        int totalDuration = 0;

        // 출발지 -> 첫 번째 경유지 -> ... -> 마지막 경유지 -> 도착지
        List<String[]> allPoints = new ArrayList<>();
        allPoints.add(startCoords);

        for (String waypoint : waypoints) {
            allPoints.add(waypoint.split(","));
        }

        allPoints.add(goalCoords);

        // 각 구간별로 경로 계산
        for (int i = 0; i < allPoints.size() - 1; i++) {
            String[] fromCoords = allPoints.get(i);
            String[] toCoords = allPoints.get(i + 1);

            logger.info("[TMAP] 구간 {} 계산: ({}, {}) -> ({}, {})",
                    i + 1, fromCoords[0], fromCoords[1], toCoords[0], toCoords[1]);

            DirectionsResponse segmentResponse = calculateDirectRoute(fromCoords, toCoords, headers);

            // 경로 병합 (첫 번째 구간이 아니면 시작점 제거하여 중복 방지)
            if (i == 0) {
                totalPath.addAll(segmentResponse.getPath());
            } else {
                List<List<Double>> segmentPath = segmentResponse.getPath();
                if (!segmentPath.isEmpty()) {
                    totalPath.addAll(segmentPath.subList(1, segmentPath.size()));
                }
            }

            totalDistance += segmentResponse.getDistance();
            totalDuration += segmentResponse.getDuration();
        }

        logger.info("[TMAP] 전체 경로 계산 완료 - 거리: {}m, 시간: {}초, 포인트: {}개",
                totalDistance, totalDuration, totalPath.size());

        return DirectionsResponse.builder()
                .path(totalPath)
                .distance(totalDistance)
                .duration(totalDuration)
                .build();
    }

    /**
     * TMAP API 응답을 DirectionsResponse로 변환
     */
    @SuppressWarnings("unchecked")
    private DirectionsResponse parseTmapResponse(Map<String, Object> body) {
        try {
            // features 배열에서 경로 정보 추출
            List<Map<String, Object>> features = (List<Map<String, Object>>) body.get("features");
            if (features == null || features.isEmpty()) {
                throw new RuntimeException("경로를 찾을 수 없습니다.");
            }

            // 첫 번째 Feature에서 전체 거리 및 시간 정보 가져오기
            Map<String, Object> firstFeature = features.get(0);
            Map<String, Object> properties = (Map<String, Object>) firstFeature.get("properties");

            int totalDistance = (Integer) properties.get("totalDistance");
            int totalTime = (Integer) properties.get("totalTime");

            // LineString 타입의 Feature에서 좌표 추출
            List<List<Double>> path = new ArrayList<>();

            for (Map<String, Object> feature : features) {
                Map<String, Object> geometry = (Map<String, Object>) feature.get("geometry");
                String type = (String) geometry.get("type");

                if ("LineString".equals(type)) {
                    List<List<Double>> coordinates = (List<List<Double>>) geometry.get("coordinates");
                    if (coordinates != null) {
                        path.addAll(coordinates);
                    }
                }
            }

            logger.info("[TMAP] 경로 계산 성공 - 거리: {}m, 시간: {}초, 포인트: {}개",
                    totalDistance, totalTime, path.size());

            return DirectionsResponse.builder()
                    .path(path)
                    .distance(totalDistance)
                    .duration(totalTime)
                    .build();

        } catch (Exception e) {
            logger.error("[TMAP] 응답 파싱 실패", e);
            throw new RuntimeException("TMAP 응답 파싱 실패: " + e.getMessage(), e);
        }
    }
}
