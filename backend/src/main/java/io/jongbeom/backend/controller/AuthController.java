package io.jongbeom.backend.controller;

import io.jongbeom.backend.dto.AuthResponse;
import io.jongbeom.backend.dto.LoginRequest;
import io.jongbeom.backend.dto.RefreshTokenRequest;
import io.jongbeom.backend.dto.SignupRequest;
import io.jongbeom.backend.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * 회원가입
     *
     * @param request 회원가입 요청 DTO
     * @return 인증 응답 (Access Token + Refresh Token + 회원 정보)
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        logger.info("[API] 회원가입 요청: {}", request.getEmail());

        AuthResponse response = authService.signup(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 로그인
     *
     * @param request 로그인 요청 DTO
     * @return 인증 응답 (Access Token + Refresh Token + 회원 정보)
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        logger.info("[API] 로그인 요청: {}", request.getEmail());

        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    /**
     * Access Token 갱신
     *
     * @param request Refresh Token 요청 DTO
     * @return 인증 응답 (새로운 Access Token + Refresh Token)
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        logger.info("[API] 토큰 갱신 요청");

        AuthResponse response = authService.refreshAccessToken(request);

        return ResponseEntity.ok(response);
    }
}
