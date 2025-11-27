package io.jongbeom.backend.service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    @Value("${jwt.secret-key:your-secret-key-min-256-bits-long-for-hs256-algorithm}")
    private String secretKey;

    @Value("${jwt.access-token-expire-minutes:30}")
    private int accessTokenExpireMinutes;

    @Value("${jwt.algorithm:HS256}")
    private String algorithm;
    
    /**
     * JWT Access Token 생성
     *
     * @param data 토큰에 포함할 데이터 (user_id, email, role 등)
     * @param expiresDelta 토큰 만료 시간 (기본값: 30분)
     * @return JWT 토큰 문자열
     */
    public String createAccessToken(Map<String, Object> data, Integer expiresDelta) {
        Map<String, Object> toEncode = new HashMap<>(data);

        Date expire;
        if (expiresDelta != null) {
            expire = Date.from(LocalDateTime.now().plusMinutes(expiresDelta).toInstant(ZoneOffset.UTC));
        } else {
            expire = Date.from(LocalDateTime.now().plusMinutes(accessTokenExpireMinutes).toInstant(ZoneOffset.UTC));
        }

        toEncode.put("iat", Date.from(LocalDateTime.now().toInstant(ZoneOffset.UTC)));

        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        String encodedJwt = Jwts.builder()
                .claims(toEncode)
                .expiration(expire)
                .signWith(key)
                .compact();

        return encodedJwt;
    }
    
    /**
     * JWT 토큰 검증 및 디코딩
     *
     * @param token JWT 토큰 문자열
     * @return 디코딩된 페이로드 또는 null (검증 실패 시)
     */
    public Claims verifyToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
            Claims payload = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return payload;
        } catch (ExpiredJwtException e) {
            logger.warn("[JWT] 토큰이 만료되었습니다: {}", e.getMessage());
            return null;
        } catch (JwtException e) {
            logger.warn("[JWT] 유효하지 않은 토큰: {}", e.getMessage());
            return null;
        }
    }

    /**
     * JWT 토큰 디코딩 (검증 포함)
     *
     * @param token JWT 토큰 문자열
     * @return 디코딩된 페이로드
     * @throws ExpiredJwtException 토큰이 만료된 경우
     * @throws JwtException 토큰이 유효하지 않은 경우
     */
    public Claims decodeToken(String token) throws ExpiredJwtException, JwtException {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        Claims payload = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return payload;
    }
}