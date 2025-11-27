package io.jongbeom.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class NaverDirectionsService {

    private static final Logger logger = LoggerFactory.getLogger(NaverDirectionsService.class);
    private static final String NAVER_DIRECTIONS_API_URL = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving";

    private final WebClient webClient;

    @Value("${naver.api.client-id}")
    private String clientId;

    @Value("${naver.api.client-secret}")
    private String clientSecret;

    public NaverDirectionsService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    /**
     * Naver Directions 5 API 호출 - 경로 검색
     *
     * @param startLongitude 출발지 경도
     * @param startLatitude 출발지 위도
     * @param goalLongitude 도착지 경도
     * @param goalLatitude 도착지 위도
     * @param option 경로 탐색 옵션 (trafast, tracomfort, traoptimal 등)
     * @return API 응답 데이터
     */
    public Mono<Map<String, Object>> getDirections(
            double startLongitude,
            double startLatitude,
            double goalLongitude,
            double goalLatitude,
            String option) {

        String start = startLongitude + "," + startLatitude;
        String goal = goalLongitude + "," + goalLatitude;

        logger.info("[Naver Directions API] 경로 검색 시작: {} -> {}", start, goal);

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("naveropenapi.apigw.ntruss.com")
                        .path("/map-direction/v1/driving")
                        .queryParam("start", start)
                        .queryParam("goal", goal)
                        .queryParam("option", option != null ? option : "traoptimal")
                        .build())
                .header("X-NCP-APIGW-API-KEY-ID", clientId)
                .header("X-NCP-APIGW-API-KEY", clientSecret)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(response -> logger.info("[Naver Directions API] 경로 검색 성공"))
                .doOnError(error -> logger.error("[Naver Directions API] 경로 검색 실패: {}", error.getMessage()));
    }

    /**
     * Naver Directions 5 API 호출 - 경유지 포함 경로 검색
     *
     * @param startLongitude 출발지 경도
     * @param startLatitude 출발지 위도
     * @param goalLongitude 도착지 경도
     * @param goalLatitude 도착지 위도
     * @param waypoints 경유지 목록 (최대 5개, "경도,위도|경도,위도" 형식)
     * @param option 경로 탐색 옵션
     * @return API 응답 데이터
     */
    public Mono<Map<String, Object>> getDirectionsWithWaypoints(
            double startLongitude,
            double startLatitude,
            double goalLongitude,
            double goalLatitude,
            String waypoints,
            String option) {

        String start = startLongitude + "," + startLatitude;
        String goal = goalLongitude + "," + goalLatitude;

        logger.info("[Naver Directions API] 경유지 포함 경로 검색 시작: {} -> {} (waypoints: {})", start, goal, waypoints);

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("naveropenapi.apigw.ntruss.com")
                        .path("/map-direction/v1/driving")
                        .queryParam("start", start)
                        .queryParam("goal", goal)
                        .queryParam("waypoints", waypoints)
                        .queryParam("option", option != null ? option : "traoptimal")
                        .build())
                .header("X-NCP-APIGW-API-KEY-ID", clientId)
                .header("X-NCP-APIGW-API-KEY", clientSecret)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(response -> logger.info("[Naver Directions API] 경유지 포함 경로 검색 성공"))
                .doOnError(error -> logger.error("[Naver Directions API] 경유지 포함 경로 검색 실패: {}", error.getMessage()));
    }
}
