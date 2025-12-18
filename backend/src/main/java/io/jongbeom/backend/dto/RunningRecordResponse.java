package io.jongbeom.backend.dto;

import io.jongbeom.backend.entity.RunningRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.LineString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 러닝 기록 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunningRecordResponse {

    private Long id;

    /**
     * 사용한 코스 ID
     */
    private UUID courseId;

    /**
     * 코스 이름
     */
    private String courseName;

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
     * 실제 이동 경로 GeoJSON
     */
    private String routeGeoJson;

    /**
     * 기록 생성 시간
     */
    private LocalDateTime createdAt;

    /**
     * 메모
     */
    private String memo;

    /**
     * 날씨 정보
     */
    private String weather;

    /**
     * 칼로리 소모량 (kcal)
     */
    private Integer calories;

    /**
     * 평균 심박수 (bpm)
     */
    private Integer avgHeartRate;

    /**
     * 엔티티를 DTO로 변환
     */
    public static RunningRecordResponse fromEntity(RunningRecord record) {
        return RunningRecordResponse.builder()
                .id(record.getId())
                .courseId(record.getCourse() != null ? record.getCourse().getId() : null)
                .courseName(record.getCourse() != null ? record.getCourse().getName() : null)
                .startTime(record.getStartTime())
                .endTime(record.getEndTime())
                .distance(record.getDistance())
                .duration(record.getDuration())
                .avgPace(record.getAvgPace())
                .avgSpeed(record.getAvgSpeed())
                .routeGeoJson(lineStringToGeoJson(record.getActualRoute()))
                .createdAt(record.getCreatedAt())
                .memo(record.getMemo())
                .weather(record.getWeather())
                .calories(record.getCalories())
                .avgHeartRate(record.getAvgHeartRate())
                .build();
    }

    /**
     * LineString을 GeoJSON 문자열로 변환
     */
    private static String lineStringToGeoJson(LineString lineString) {
        if (lineString == null) {
            return null;
        }

        List<List<Double>> coordinates = new ArrayList<>();
        for (Coordinate coord : lineString.getCoordinates()) {
            List<Double> point = new ArrayList<>();
            point.add(coord.getX()); // longitude
            point.add(coord.getY()); // latitude
            coordinates.add(point);
        }

        // GeoJSON 형식으로 변환
        return String.format(
                "{\"type\":\"LineString\",\"coordinates\":%s}",
                coordinatesToJsonArray(coordinates)
        );
    }

    /**
     * 좌표 배열을 JSON 배열 문자열로 변환
     */
    private static String coordinatesToJsonArray(List<List<Double>> coordinates) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < coordinates.size(); i++) {
            if (i > 0) sb.append(",");
            List<Double> point = coordinates.get(i);
            sb.append(String.format("[%f,%f]", point.get(0), point.get(1)));
        }
        sb.append("]");
        return sb.toString();
    }
}
