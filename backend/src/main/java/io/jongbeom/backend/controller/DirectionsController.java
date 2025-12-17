package io.jongbeom.backend.controller;

import io.jongbeom.backend.dto.DirectionsRequest;
import io.jongbeom.backend.dto.DirectionsResponse;
import io.jongbeom.backend.service.DirectionsService;
import io.jongbeom.backend.service.KakaoMobilityService;
import io.jongbeom.backend.service.TmapPedestrianService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
public class DirectionsController {

    private static final Logger logger = LoggerFactory.getLogger(DirectionsController.class);

    private final DirectionsService directionsService;
    private final KakaoMobilityService kakaoMobilityService;
    private final TmapPedestrianService tmapPedestrianService;

    /**
     * 경로 계산 (네이버 Directions 5 API)
     *
     * POST /api/directions
     */
    @PostMapping
    public ResponseEntity<DirectionsResponse> getDirections(
            @RequestBody DirectionsRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("[Directions] 경로 계산 요청: user={}, start={}, goal={}",
                email, request.getStart(), request.getGoal());

        try {
            // waypoints를 : 구분자로 연결
            String waypointsParam = null;
            if (request.getWaypoints() != null && !request.getWaypoints().isEmpty()) {
                waypointsParam = String.join(":", request.getWaypoints());
            }

            DirectionsService.DirectionsResult result = directionsService.getRoute(
                    request.getStart(),
                    request.getGoal(),
                    waypointsParam
            );

            DirectionsResponse response = DirectionsResponse.builder()
                    .path(result.getPath())
                    .distance(result.getDistance())
                    .duration(result.getDuration())
                    .build();

            logger.info("[Directions] 경로 계산 성공: distance={}m, duration={}s",
                    result.getDistance(), result.getDuration());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("[Directions] 경로 계산 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 보행자 경로 계산 (카카오 모빌리티 API)
     *
     * POST /api/directions/kakao
     */
    @PostMapping("/kakao")
    public ResponseEntity<DirectionsResponse> getKakaoDirections(
            @RequestBody DirectionsRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("[KakaoDirections] 보행자 경로 계산 요청: user={}, start={}, goal={}",
                email, request.getStart(), request.getGoal());

        try {
            DirectionsResponse response = kakaoMobilityService.getWalkingRoute(request);

            logger.info("[KakaoDirections] 경로 계산 성공: distance={}m, duration={}s",
                    response.getDistance(), response.getDuration());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("[KakaoDirections] 경로 계산 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 보행자 경로 계산 (TMAP API)
     *
     * POST /api/directions/tmap
     */
    @PostMapping("/tmap")
    public ResponseEntity<DirectionsResponse> getTmapDirections(
            @RequestBody DirectionsRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        logger.info("[TmapDirections] 보행자 경로 계산 요청: user={}, start={}, goal={}",
                email, request.getStart(), request.getGoal());

        try {
            DirectionsResponse response = tmapPedestrianService.getPedestrianRoute(request);

            logger.info("[TmapDirections] 경로 계산 성공: distance={}m, duration={}s",
                    response.getDistance(), response.getDuration());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("[TmapDirections] 경로 계산 실패: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
