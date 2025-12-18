package io.jongbeom.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.LineString;

import java.time.LocalDateTime;

/**
 * 러닝 기록 엔티티
 *
 * 사용자가 실제로 러닝한 기록을 저장합니다.
 * - 코스 기반 러닝
 * - 실제 이동 경로 (GeoJSON LineString)
 * - 통계 데이터 (거리, 시간, 페이스, 속도)
 */
@Entity
@Table(name = "running_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunningRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 러닝한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    /**
     * 사용한 코스 (nullable - 코스 없이 자유 러닝 가능)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    /**
     * 러닝 시작 시간
     */
    @Column(nullable = false)
    private LocalDateTime startTime;

    /**
     * 러닝 종료 시간
     */
    @Column(nullable = false)
    private LocalDateTime endTime;

    /**
     * 총 이동 거리 (미터)
     */
    @Column(nullable = false)
    private Double distance;

    /**
     * 총 소요 시간 (초)
     */
    @Column(nullable = false)
    private Integer duration;

    /**
     * 평균 페이스 (초/km)
     */
    @Column(nullable = false)
    private Double avgPace;

    /**
     * 평균 속도 (m/s)
     */
    @Column(nullable = false)
    private Double avgSpeed;

    /**
     * 실제 이동 경로 (GeoJSON LineString)
     * 사용자가 실제로 이동한 GPS 경로
     */
    @Column(columnDefinition = "geography(LineString, 4326)")
    private LineString actualRoute;

    /**
     * 기록 생성 시간
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 메모 (선택 사항)
     */
    @Column(length = 500)
    private String memo;

    /**
     * 날씨 정보 (선택 사항)
     */
    @Column(length = 50)
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
