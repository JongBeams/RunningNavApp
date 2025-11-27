package io.jongbeom.backend.service;

import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    @Test
    void testCreateAndVerifyToken() {
        // Given: 토큰에 포함할 데이터
        Map<String, Object> data = new HashMap<>();
        data.put("user_id", 123);
        data.put("email", "test@example.com");
        data.put("role", "USER");

        // When: 토큰 생성
        String token = jwtService.createAccessToken(data, null);
        System.out.println("Generated Token: " + token);

        // Then: 토큰 검증
        Claims claims = jwtService.verifyToken(token);
        assertNotNull(claims);
        assertEquals(123, claims.get("user_id"));
        assertEquals("test@example.com", claims.get("email"));
        assertEquals("USER", claims.get("role"));

        System.out.println("Token verified successfully!");
        System.out.println("Claims: " + claims);
    }

    @Test
    void testExpiredToken() {
        // Given: 1분 후 만료되는 토큰
        Map<String, Object> data = new HashMap<>();
        data.put("user_id", 456);

        // When: 토큰 생성 (1분 만료)
        String token = jwtService.createAccessToken(data, 1);

        // Then: 즉시 검증하면 성공
        Claims claims = jwtService.verifyToken(token);
        assertNotNull(claims);
        assertEquals(456, claims.get("user_id"));
    }

    @Test
    void testInvalidToken() {
        // Given: 잘못된 토큰
        String invalidToken = "invalid.token.here";

        // When: 검증 시도
        Claims claims = jwtService.verifyToken(invalidToken);

        // Then: null 반환
        assertNull(claims);
    }
}
