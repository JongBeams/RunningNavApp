package io.jongbeom.backend.repository;

import io.jongbeom.backend.entity.Course;
import io.jongbeom.backend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    /**
     * 특정 사용자의 활성화된 코스 목록 조회
     */
    List<Course> findByProfileAndIsActiveTrueOrderByCreatedAtDesc(Profile profile);

    /**
     * 특정 사용자의 모든 코스 조회
     */
    List<Course> findByProfileOrderByCreatedAtDesc(Profile profile);
}
