package io.jongbeom.backend.repository;

import io.jongbeom.backend.entity.RunningRecord;
import io.jongbeom.backend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 러닝 기록 레포지토리
 */
@Repository
public interface RunningRecordRepository extends JpaRepository<RunningRecord, Long> {

    /**
     * 특정 사용자의 모든 러닝 기록 조회 (최신순)
     */
    List<RunningRecord> findByProfileOrderByCreatedAtDesc(Profile profile);

    /**
     * 특정 사용자의 러닝 기록 조회 (날짜 범위)
     */
    @Query("SELECT r FROM RunningRecord r WHERE r.profile = :profile " +
           "AND r.startTime >= :startDate AND r.startTime < :endDate " +
           "ORDER BY r.startTime DESC")
    List<RunningRecord> findByProfileAndDateRange(
            @Param("profile") Profile profile,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 특정 사용자의 총 러닝 거리 계산
     */
    @Query("SELECT COALESCE(SUM(r.distance), 0) FROM RunningRecord r WHERE r.profile = :profile")
    Double getTotalDistanceByProfile(@Param("profile") Profile profile);

    /**
     * 특정 사용자의 총 러닝 시간 계산 (초)
     */
    @Query("SELECT COALESCE(SUM(r.duration), 0) FROM RunningRecord r WHERE r.profile = :profile")
    Long getTotalDurationByProfile(@Param("profile") Profile profile);

    /**
     * 특정 사용자의 러닝 기록 개수
     */
    Long countByProfile(Profile profile);

    /**
     * 특정 코스의 러닝 기록 조회 (최신순)
     */
    @Query("SELECT r FROM RunningRecord r WHERE r.course.id = :courseId " +
           "ORDER BY r.createdAt DESC")
    List<RunningRecord> findByCourseId(@Param("courseId") Long courseId);
}
