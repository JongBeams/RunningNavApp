package io.jongbeom.backend.service;

import io.jongbeom.backend.dto.*;
import io.jongbeom.backend.entity.Profile;
import io.jongbeom.backend.exception.DuplicateEmailException;
import io.jongbeom.backend.exception.InvalidCredentialsException;
import io.jongbeom.backend.exception.InvalidTokenException;
import io.jongbeom.backend.exception.UserNotFoundException;
import io.jongbeom.backend.repository.ProfileRepository;
import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final ProfileRepository profileRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(ProfileRepository profileRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.profileRepository = profileRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * 회원가입
     *
     * @param request 회원가입 요청 DTO
     * @return 인증 응답 (Access Token + Refresh Token + 회원 정보)
     */
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        logger.info("[회원가입] 시작: {}", request.getEmail());

        // 이메일 중복 확인
        if (profileRepository.existsByEmail(request.getEmail())) {
            logger.warn("[회원가입] 이메일 중복: {}", request.getEmail());
            throw new DuplicateEmailException("이미 사용 중인 이메일입니다: " + request.getEmail());
        }

        // 비밀번호 암호화
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 회원 생성
        Profile profile = Profile.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .passwordHash(hashedPassword)
                .isActive(true)
                .build();

        // 저장
        Profile savedProfile = profileRepository.save(profile);

        // JWT 토큰 생성 (user_id, email 포함)
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("user_id", savedProfile.getId().toString());
        tokenData.put("email", savedProfile.getEmail());

        String accessToken = jwtService.createAccessToken(tokenData, null);
        String refreshToken = jwtService.createRefreshToken(tokenData);

        // Refresh Token을 DB에 저장
        savedProfile.setRefreshToken(refreshToken);
        savedProfile.setRefreshTokenExpiresAt(
                OffsetDateTime.of(jwtService.getRefreshTokenExpiresAt(), ZoneOffset.UTC)
        );
        profileRepository.save(savedProfile);

        logger.info("[회원가입] 완료: {} (ID: {})", savedProfile.getEmail(), savedProfile.getId());

        // ProfileResponse 생성
        ProfileResponse profileResponse = toProfileResponse(savedProfile);

        return new AuthResponse(accessToken, refreshToken, profileResponse);
    }

    /**
     * 로그인
     *
     * @param request 로그인 요청 DTO
     * @return 인증 응답 (Access Token + Refresh Token + 회원 정보)
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        logger.info("[로그인] 시작: {}", request.getEmail());

        // 회원 조회
        Profile profile = profileRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.warn("[로그인] 존재하지 않는 이메일: {}", request.getEmail());
                    return new InvalidCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
                });

        // 비밀번호 확인
        if (!passwordEncoder.matches(request.getPassword(), profile.getPasswordHash())) {
            logger.warn("[로그인] 비밀번호 불일치: {}", request.getEmail());
            throw new InvalidCredentialsException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        // 활성 계정 확인
        if (!profile.getIsActive()) {
            logger.warn("[로그인] 비활성 계정: {}", request.getEmail());
            throw new InvalidCredentialsException("비활성화된 계정입니다.");
        }

        // JWT 토큰 생성
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("user_id", profile.getId().toString());
        tokenData.put("email", profile.getEmail());

        String accessToken = jwtService.createAccessToken(tokenData, null);
        String refreshToken = jwtService.createRefreshToken(tokenData);

        // Refresh Token을 DB에 저장
        profile.setRefreshToken(refreshToken);
        profile.setRefreshTokenExpiresAt(
                OffsetDateTime.of(jwtService.getRefreshTokenExpiresAt(), ZoneOffset.UTC)
        );
        profileRepository.save(profile);

        logger.info("[로그인] 완료: {} (ID: {})", profile.getEmail(), profile.getId());

        // ProfileResponse 생성
        ProfileResponse profileResponse = toProfileResponse(profile);

        return new AuthResponse(accessToken, refreshToken, profileResponse);
    }

    /**
     * Refresh Token으로 Access Token 갱신
     *
     * @param request Refresh Token 요청 DTO
     * @return 인증 응답 (새로운 Access Token + Refresh Token)
     */
    @Transactional
    public AuthResponse refreshAccessToken(RefreshTokenRequest request) {
        logger.info("[토큰 갱신] 시작");

        String refreshToken = request.getRefreshToken();

        // Refresh Token 검증
        Claims claims = jwtService.verifyToken(refreshToken);
        if (claims == null) {
            logger.warn("[토큰 갱신] 유효하지 않은 Refresh Token");
            throw new InvalidTokenException("유효하지 않은 Refresh Token입니다.");
        }

        // DB에서 Refresh Token 확인
        Profile profile = profileRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> {
                    logger.warn("[토큰 갱신] DB에 없는 Refresh Token");
                    return new InvalidTokenException("유효하지 않은 Refresh Token입니다.");
                });

        // Refresh Token 만료 확인
        if (profile.getRefreshTokenExpiresAt().isBefore(OffsetDateTime.now())) {
            logger.warn("[토큰 갱신] 만료된 Refresh Token: {}", profile.getEmail());
            throw new InvalidTokenException("만료된 Refresh Token입니다. 다시 로그인해주세요.");
        }

        // 새로운 Access Token 생성
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("user_id", profile.getId().toString());
        tokenData.put("email", profile.getEmail());

        String newAccessToken = jwtService.createAccessToken(tokenData, null);

        logger.info("[토큰 갱신] 완료: {} (ID: {})", profile.getEmail(), profile.getId());

        // ProfileResponse 생성
        ProfileResponse profileResponse = toProfileResponse(profile);

        return new AuthResponse(newAccessToken, refreshToken, profileResponse);
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
