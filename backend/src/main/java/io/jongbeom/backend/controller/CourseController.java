package io.jongbeom.backend.controller;

import io.jongbeom.backend.dto.CourseRequest;
import io.jongbeom.backend.dto.CourseResponse;
import io.jongbeom.backend.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@Slf4j
public class CourseController {

    private final CourseService courseService;

    /**
     * 코스 생성
     */
    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        log.info("[API] 코스 생성 요청: email={}, name={}", email, request.getName());

        CourseResponse response = courseService.createCourse(email, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 내 코스 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<CourseResponse>> getMyCourses(Authentication authentication) {
        String email = authentication.getName();
        log.info("[API] 코스 목록 조회 요청: email={}", email);

        List<CourseResponse> courses = courseService.getMyCourses(email);

        return ResponseEntity.ok(courses);
    }

    /**
     * 코스 상세 조회
     */
    @GetMapping("/{courseId}")
    public ResponseEntity<CourseResponse> getCourseById(
            @PathVariable String courseId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        log.info("[API] 코스 상세 조회 요청: email={}, courseId={}", email, courseId);

        CourseResponse response = courseService.getCourseById(email, courseId);

        return ResponseEntity.ok(response);
    }

    /**
     * 코스 삭제
     */
    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable String courseId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        log.info("[API] 코스 삭제 요청: email={}, courseId={}", email, courseId);

        courseService.deleteCourse(email, courseId);

        return ResponseEntity.noContent().build();
    }
}
