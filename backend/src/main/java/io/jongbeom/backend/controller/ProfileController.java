package io.jongbeom.backend.controller;

import io.jongbeom.backend.dto.ProfileResponse;
import io.jongbeom.backend.service.ProfileService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final Logger logger = LoggerFactory.getLogger(ProfileController.class);

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    /**
     * 내 정보 조회
     *
     * @param authentication Spring Security 인증 객체
     * @return 회원 정보 DTO
     */
    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        logger.info("[API] 내 정보 조회: user_id={}", userId);

        ProfileResponse response = profileService.getProfileById(UUID.fromString(userId));

        return ResponseEntity.ok(response);
    }

    /**
     * 내 정보 수정
     *
     * @param authentication Spring Security 인증 객체
     * @param request 수정할 정보 (fullName, phone)
     * @return 수정된 회원 정보 DTO
     */
    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> updateMyProfile(
            Authentication authentication,
            @RequestBody Map<String, String> request) {

        String userId = (String) authentication.getPrincipal();
        logger.info("[API] 내 정보 수정: user_id={}", userId);

        String fullName = request.get("fullName");
        String phone = request.get("phone");

        ProfileResponse response = profileService.updateProfile(
                UUID.fromString(userId),
                fullName,
                phone
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 회원 탈퇴 (비활성화)
     *
     * @param authentication Spring Security 인증 객체
     * @return 성공 메시지
     */
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deactivateMyProfile(Authentication authentication) {
        String userId = (String) authentication.getPrincipal();
        logger.info("[API] 회원 탈퇴: user_id={}", userId);

        profileService.deactivateProfile(UUID.fromString(userId));

        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
    }
}
