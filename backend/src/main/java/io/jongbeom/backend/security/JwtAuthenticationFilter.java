package io.jongbeom.backend.security;

import io.jongbeom.backend.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Authorization 헤더에서 JWT 토큰 추출
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // "Bearer " 제거하고 토큰만 추출
            String token = authHeader.substring(7);

            // 토큰 검증
            Claims claims = jwtService.verifyToken(token);

            if (claims != null) {
                // user_id와 email 추출
                String userId = claims.get("user_id", String.class);
                String email = claims.get("email", String.class);

                if (userId != null && email != null) {
                    // Spring Security 인증 객체 생성
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userId,  // principal: user_id
                                    null,    // credentials: 비밀번호는 필요 없음
                                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))
                            );

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // SecurityContext에 인증 정보 설정
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    logger.debug("[JWT 인증] 성공: user_id={}, email={}", userId, email);
                }
            }

        } catch (Exception e) {
            logger.warn("[JWT 인증] 실패: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
