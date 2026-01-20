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

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseService {

    private static final String SHARE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHARE_CODE_LENGTH = 8;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final CourseRepository courseRepository;
    private final ProfileRepository profileRepository;

    /**
     * 고유한 8자리 shareCode 생성 (영문 대문자 + 숫자)
     */
    private String generateUniqueShareCode() {
        String shareCode;
        int maxAttempts = 10;
        int attempts = 0;

        do {
            StringBuilder sb = new StringBuilder(SHARE_CODE_LENGTH);
            for (int i = 0; i < SHARE_CODE_LENGTH; i++) {
                sb.append(SHARE_CODE_CHARS.charAt(SECURE_RANDOM.nextInt(SHARE_CODE_CHARS.length())));
            }
            shareCode = sb.toString();
            attempts++;

            if (attempts >= maxAttempts) {
                throw new IllegalStateException("고유한 공유 코드를 생성할 수 없습니다.");
            }
        } while (courseRepository.existsByShareCode(shareCode));

        return shareCode;
    }

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

            // 고유한 shareCode 생성
            String shareCode = generateUniqueShareCode();

            Course course = Course.builder()
                    .name(request.getName())
                    .route(route)
                    .waypoints(waypoints)
                    .distance(request.getDistance())
                    .duration(request.getDuration())
                    .profile(profile)
                    .isActive(true)
                    .shareCode(shareCode)
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

    /**
     * shareCode로 코스 조회 (공개 조회 - 인증 불필요)
     */
    @Transactional(readOnly = true)
    public CourseResponse getCourseByShareCode(String shareCode) {
        log.info("[코스 조회 by shareCode] shareCode={}", shareCode);

        Course course = courseRepository.findByShareCodeAndIsActiveTrue(shareCode)
                .orElseThrow(() -> new ResourceNotFoundException("해당 공유 코드의 코스를 찾을 수 없습니다."));

        return CourseResponse.from(course);
    }
}
