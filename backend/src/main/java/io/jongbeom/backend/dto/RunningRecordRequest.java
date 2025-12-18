package io.jongbeom.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * 러닝 기록 저장 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunningRecordRequest {

    /**
     * 사용한 코스 ID (optional - 코스 없이 자유 러닝 가능)
     */
    private UUID courseId;

    /**
     * 러닝 시작 시간
     */
    private LocalDateTime startTime;

    /**
     * 러닝 종료 시간
     */
    private LocalDateTime endTime;

    /**
     * 총 이동 거리 (미터)
     */
    private Double distance;

    /**
     * 총 소요 시간 (초)
     */
    private Integer duration;

    /**
     * 평균 페이스 (초/km)
     */
    private Double avgPace;

    /**
     * 평균 속도 (m/s)
     */
    private Double avgSpeed;

    /**
     * 실제 이동 경로 (좌표 배열)
     * [ [lng, lat], [lng, lat], ... ]
     */
    private List<List<Double>> routeCoordinates;

    /**
     * 메모 (선택 사항)
     */
    private String memo;

    /**
     * 날씨 정보 (선택 사항)
     */
    private String weather;

    /**
     * 칼로리 소모량 (선택 사항, kcal)
     */
    private Integer calories;

    /**
     * 평균 심박수 (선택 사항, bpm)
     */
    private Integer avgHeartRate;
}
