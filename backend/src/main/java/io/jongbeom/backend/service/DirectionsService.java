package io.jongbeom.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.ArrayList;

@Service
public class DirectionsService {

    @Value("${naver.api.client-id}")
    private String clientId;

    @Value("${naver.api.client-secret}")
    private String clientSecret;

    private static final String DIRECTIONS_API_URL = "https://maps.apigw.ntruss.com/map-direction/v1/driving";

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 네이버 Directions 5 API 호출
     *
     * @param start "경도,위도" 형식
     * @param goal "경도,위도" 형식
     * @param waypoints "경도,위도:경도,위도" 형식 (선택)
     * @param option trafast, tracomfort, traoptimal
     * @return Directions API 응답
     */
    public JsonNode getDirections(String start, String goal, String waypoints, String option) {
        // URL 생성
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(DIRECTIONS_API_URL)
                .queryParam("start", start)
                .queryParam("goal", goal)
                .queryParam("option", option != null ? option : "trafast");

        if (waypoints != null && !waypoints.isEmpty()) {
            builder.queryParam("waypoints", waypoints);
        }

        String url = builder.toUriString();

        // 디버깅: API 키 확인 (마스킹)
        System.out.println("[Directions API] Client ID: " + clientId);
        System.out.println("[Directions API] Client Secret: " +
            (clientSecret != null ? clientSecret.substring(0, Math.min(10, clientSecret.length())) + "..." : "null"));
        System.out.println("[Directions API] Request URL: " + url);

        // 헤더 설정
        HttpHeaders headers = new HttpHeaders();
        headers.set("x-ncp-apigw-api-key-id", clientId);
        headers.set("x-ncp-apigw-api-key", clientSecret);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        // API 호출
        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
        );

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            throw new RuntimeException("Directions API 응답 파싱 실패", e);
        }
    }

    /**
     * 경로 정보 추출 (간단한 버전)
     */
    public DirectionsResult getRoute(String start, String goal, String waypoints) {
        JsonNode response = getDirections(start, goal, waypoints, "trafast");

        int code = response.get("code").asInt();
        if (code != 0) {
            throw new RuntimeException("Directions API Error: " + response.get("message").asText());
        }

        JsonNode route = response.get("route").get("trafast").get(0);
        JsonNode summary = route.get("summary");

        // path 추출
        List<List<Double>> path = new ArrayList<>();
        JsonNode pathNode = route.get("path");
        if (pathNode != null && pathNode.isArray()) {
            for (JsonNode coord : pathNode) {
                List<Double> point = new ArrayList<>();
                point.add(coord.get(0).asDouble()); // 경도
                point.add(coord.get(1).asDouble()); // 위도
                path.add(point);
            }
        }

        return DirectionsResult.builder()
                .path(path)
                .distance(summary.get("distance").asInt())
                .duration(summary.get("duration").asInt() / 1000) // 밀리초 -> 초
                .build();
    }

    @lombok.Data
    @lombok.Builder
    public static class DirectionsResult {
        private List<List<Double>> path; // [경도, 위도] 배열
        private int distance; // 미터
        private int duration; // 초
    }
}
