package io.jongbeom.backend.service;

import io.jongbeom.backend.dto.RunningRecordRequest;
import io.jongbeom.backend.dto.RunningRecordResponse;
import io.jongbeom.backend.entity.Course;
import io.jongbeom.backend.entity.Profile;
import io.jongbeom.backend.entity.RunningRecord;
import io.jongbeom.backend.repository.CourseRepository;
import io.jongbeom.backend.repository.ProfileRepository;
import io.jongbeom.backend.repository.RunningRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 러닝 기록 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RunningRecordService {

    private final RunningRecordRepository runningRecordRepository;
    private final ProfileRepository profileRepository;
    private final CourseRepository courseRepository;

    // GeometryFactory (SRID 4326 = WGS84)
    private final GeometryFactory geometryFactory =
            new GeometryFactory(new PrecisionModel(), 4326);

    /**
     * 러닝 기록 저장
     */
    @Transactional
    public RunningRecordResponse createRecord(String email, RunningRecordRequest request) {
        log.info("[RunningRecord] 러닝 기록 저장 시작 - Email: {}", email);

        // Profile 조회
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + email));

        // Course 조회 (optional)
        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Course not found: " + request.getCourseId()));
        }

        // 좌표 배열을 LineString으로 변환
        LineString actualRoute = null;
        if (request.getRouteCoordinates() != null && !request.getRouteCoordinates().isEmpty()) {
            actualRoute = createLineString(request.getRouteCoordinates());
        }

        // 엔티티 생성
        RunningRecord record = RunningRecord.builder()
                .profile(profile)
                .course(course)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .distance(request.getDistance())
                .duration(request.getDuration())
                .avgPace(request.getAvgPace())
                .avgSpeed(request.getAvgSpeed())
                .actualRoute(actualRoute)
                .memo(request.getMemo())
                .weather(request.getWeather())
                .calories(request.getCalories())
                .avgHeartRate(request.getAvgHeartRate())
                .build();

        RunningRecord savedRecord = runningRecordRepository.save(record);
        log.info("[RunningRecord] 러닝 기록 저장 완료 - ID: {}", savedRecord.getId());

        return RunningRecordResponse.fromEntity(savedRecord);
    }

    /**
     * 내 러닝 기록 목록 조회
     */
    @Transactional(readOnly = true)
    public List<RunningRecordResponse> getMyRecords(String email) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + email));

        List<RunningRecord> records = runningRecordRepository
                .findByProfileOrderByCreatedAtDesc(profile);

        return records.stream()
                .map(RunningRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * 러닝 기록 상세 조회
     */
    @Transactional(readOnly = true)
    public RunningRecordResponse getRecordById(Long recordId) {
        RunningRecord record = runningRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Running record not found: " + recordId));

        return RunningRecordResponse.fromEntity(record);
    }

    /**
     * 러닝 기록 삭제
     */
    @Transactional
    public void deleteRecord(String email, Long recordId) {
        RunningRecord record = runningRecordRepository.findById(recordId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Running record not found: " + recordId));

        // 본인의 기록인지 확인
        if (!record.getProfile().getEmail().equals(email)) {
            throw new IllegalArgumentException("Not authorized to delete this record");
        }

        runningRecordRepository.delete(record);
        log.info("[RunningRecord] 러닝 기록 삭제 완료 - ID: {}", recordId);
    }

    /**
     * 사용자 통계 조회
     */
    @Transactional(readOnly = true)
    public RunningStatistics getStatistics(String email) {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + email));

        Double totalDistance = runningRecordRepository.getTotalDistanceByProfile(profile);
        Long totalDuration = runningRecordRepository.getTotalDurationByProfile(profile);
        Long totalCount = runningRecordRepository.countByProfile(profile);

        return RunningStatistics.builder()
                .totalDistance(totalDistance != null ? totalDistance : 0.0)
                .totalDuration(totalDuration != null ? totalDuration : 0L)
                .totalCount(totalCount != null ? totalCount : 0L)
                .build();
    }

    /**
     * 좌표 배열을 LineString으로 변환
     */
    private LineString createLineString(List<List<Double>> coordinates) {
        Coordinate[] coords = coordinates.stream()
                .map(coord -> new Coordinate(coord.get(0), coord.get(1))) // lng, lat
                .toArray(Coordinate[]::new);

        return geometryFactory.createLineString(coords);
    }

    /**
     * 러닝 통계 DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RunningStatistics {
        private Double totalDistance; // 총 거리 (미터)
        private Long totalDuration;   // 총 시간 (초)
        private Long totalCount;      // 총 러닝 횟수
    }
}
