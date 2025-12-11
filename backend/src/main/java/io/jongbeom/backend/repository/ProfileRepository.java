package io.jongbeom.backend.repository;

import io.jongbeom.backend.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    /**
     * 이메일로 회원 찾기
     * @param email 이메일
     * @return Optional<Profile>
     */
    Optional<Profile> findByEmail(String email);

    /**
     * 이메일 존재 여부 확인
     * @param email 이메일
     * @return 존재 여부
     */
    boolean existsByEmail(String email);

    /**
     * Refresh Token으로 회원 찾기
     * @param refreshToken Refresh Token
     * @return Optional<Profile>
     */
    Optional<Profile> findByRefreshToken(String refreshToken);
}
