package io.jongbeom.backend.service;

import io.jongbeom.backend.dto.ProfileResponse;
import io.jongbeom.backend.entity.Profile;
import io.jongbeom.backend.exception.UserNotFoundException;
import io.jongbeom.backend.repository.ProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ProfileService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileService.class);

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    /**
     * 회원 정보 조회 (ID)
     *
     * @param userId 회원 ID
     * @return 회원 정보 DTO
     */
    @Transactional(readOnly = true)
    public ProfileResponse getProfileById(UUID userId) {
        logger.info("[회원 조회] ID: {}", userId);

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("[회원 조회] 존재하지 않는 ID: {}", userId);
                    return new UserNotFoundException("존재하지 않는 회원입니다.");
                });

        return toProfileResponse(profile);
    }

    /**
     * 회원 정보 조회 (이메일)
     *
     * @param email 이메일
     * @return 회원 정보 DTO
     */
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByEmail(String email) {
        logger.info("[회원 조회] Email: {}", email);

        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("[회원 조회] 존재하지 않는 이메일: {}", email);
                    return new UserNotFoundException("존재하지 않는 회원입니다.");
                });

        return toProfileResponse(profile);
    }

    /**
     * 회원 정보 수정
     *
     * @param userId 회원 ID
     * @param fullName 이름 (optional)
     * @param phone 전화번호 (optional)
     * @return 수정된 회원 정보 DTO
     */
    @Transactional
    public ProfileResponse updateProfile(UUID userId, String fullName, String phone) {
        logger.info("[회원 수정] ID: {}", userId);

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("[회원 수정] 존재하지 않는 ID: {}", userId);
                    return new UserNotFoundException("존재하지 않는 회원입니다.");
                });

        // 수정
        if (fullName != null && !fullName.isBlank()) {
            profile.setFullName(fullName);
        }

        if (phone != null && !phone.isBlank()) {
            profile.setPhone(phone);
        }

        Profile updatedProfile = profileRepository.save(profile);

        logger.info("[회원 수정] 완료: {} (ID: {})", updatedProfile.getEmail(), updatedProfile.getId());

        return toProfileResponse(updatedProfile);
    }

    /**
     * 회원 비활성화
     *
     * @param userId 회원 ID
     */
    @Transactional
    public void deactivateProfile(UUID userId) {
        logger.info("[회원 비활성화] ID: {}", userId);

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("[회원 비활성화] 존재하지 않는 ID: {}", userId);
                    return new UserNotFoundException("존재하지 않는 회원입니다.");
                });

        profile.setIsActive(false);
        profileRepository.save(profile);

        logger.info("[회원 비활성화] 완료: {} (ID: {})", profile.getEmail(), profile.getId());
    }

    /**
     * Profile Entity를 ProfileResponse DTO로 변환
     *
     * @param profile Profile Entity
     * @return ProfileResponse DTO
     */
    private ProfileResponse toProfileResponse(Profile profile) {
        return ProfileResponse.builder()
                .id(profile.getId())
                .email(profile.getEmail())
                .fullName(profile.getFullName())
                .phone(profile.getPhone())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .isActive(profile.getIsActive())
                .build();
    }
}
