package io.jongbeom.backend.service;

import io.jongbeom.backend.dto.CourseRequest;
import io.jongbeom.backend.dto.CourseResponse;
import io.jongbeom.backend.entity.Course;
import io.jongbeom.backend.entity.Profile;
import io.jongbeom.backend.exception.ResourceNotFoundException;
import io.jongbeom.backend.repository.CourseRepository;
import io.jongbeom.backend.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.locationtech.jts.geom.LineString;
import org.locationtech.jts.geom.MultiPoint;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private final CourseRepository courseRepository;
    private final ProfileRepository profileRepository;

    /**
     * 코스 생성
     */
    @Transactional
    public CourseResponse createCourse(String email, CourseRequest request) {
        log.info("[코스 생성] 시작: email={}, name={}", email, request.getName());

        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        try {
            GeoJsonReader reader = new GeoJsonReader();

            // GeoJSON 문자열을 JTS Geometry로 파싱
            LineString route = (LineString) reader.read(request.getRouteGeoJson());
            MultiPoint waypoints = (MultiPoint) reader.read(request.getWaypointsGeoJson());

            // SRID 설정 (WGS84 = 4326)
            route.setSRID(4326);
            waypoints.setSRID(4326);

            Course course = Course.builder()
                    .name(request.getName())
                    .route(route)
                    .waypoints(waypoints)
                    .distance(request.getDistance())
                    .duration(request.getDuration())
                    .profile(profile)
                    .isActive(true)
                    .build();

            Course savedCourse = courseRepository.save(course);

            log.info("[코스 생성] 완료: id={}", savedCourse.getId());

            return CourseResponse.from(savedCourse);
        } catch (ParseException e) {
            log.error("[코스 생성] GeoJSON 파싱 실패: {}", e.getMessage());
            throw new IllegalArgumentException("잘못된 GeoJSON 형식입니다: " + e.getMessage());
        }
    }

    /**
     * 사용자의 모든 코스 조회
     */
    @Transactional(readOnly = true)
    public List<CourseResponse> getMyCourses(String email) {
        log.info("[코스 목록 조회] email={}", email);

        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        List<Course> courses = courseRepository.findByProfileAndIsActiveTrueOrderByCreatedAtDesc(profile);

        return courses.stream()
                .map(CourseResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 특정 코스 조회
     */
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(String email, String courseId) {
        log.info("[코스 상세 조회] email={}, courseId={}", email, courseId);

        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        Course course = courseRepository.findById(UUID.fromString(courseId))
                .orElseThrow(() -> new ResourceNotFoundException("코스를 찾을 수 없습니다."));

        // 본인의 코스인지 확인
        if (!course.getProfile().getId().equals(profile.getId())) {
            throw new ResourceNotFoundException("접근 권한이 없습니다.");
        }

        return CourseResponse.from(course);
    }

    /**
     * 코스 삭제 (논리 삭제)
     */
    @Transactional
    public void deleteCourse(String email, String courseId) {
        log.info("[코스 삭제] email={}, courseId={}", email, courseId);

        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));

        Course course = courseRepository.findById(UUID.fromString(courseId))
                .orElseThrow(() -> new ResourceNotFoundException("코스를 찾을 수 없습니다."));

        // 본인의 코스인지 확인
        if (!course.getProfile().getId().equals(profile.getId())) {
            throw new ResourceNotFoundException("접근 권한이 없습니다.");
        }

        course.setIsActive(false);
        courseRepository.save(course);

        log.info("[코스 삭제] 완료: courseId={}", courseId);
    }
}
