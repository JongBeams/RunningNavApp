package io.jongbeom.backend.controller;

import io.jongbeom.backend.dto.RunningRecordRequest;
import io.jongbeom.backend.dto.RunningRecordResponse;
import io.jongbeom.backend.service.RunningRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 러닝 기록 API 컨트롤러
 */
@RestController
@RequestMapping("/api/running-records")
@RequiredArgsConstructor
@Slf4j
public class RunningRecordController {

    private final RunningRecordService runningRecordService;

    /**
     * 러닝 기록 저장
     *
     * POST /api/running-records
     */
    @PostMapping
    public ResponseEntity<RunningRecordResponse> createRecord(
            @RequestBody RunningRecordRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        log.info("[RunningRecordController] 러닝 기록 저장 요청 - Email: {}", email);

        RunningRecordResponse response = runningRecordService.createRecord(email, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 내 러닝 기록 목록 조회
     *
     * GET /api/running-records
     */
    @GetMapping
    public ResponseEntity<List<RunningRecordResponse>> getMyRecords(
            Authentication authentication) {

        String email = authentication.getName();
        log.info("[RunningRecordController] 러닝 기록 목록 조회 - Email: {}", email);

        List<RunningRecordResponse> records = runningRecordService.getMyRecords(email);
        return ResponseEntity.ok(records);
    }

    /**
     * 러닝 기록 상세 조회
     *
     * GET /api/running-records/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<RunningRecordResponse> getRecordById(@PathVariable Long id) {
        log.info("[RunningRecordController] 러닝 기록 상세 조회 - ID: {}", id);

        RunningRecordResponse record = runningRecordService.getRecordById(id);
        return ResponseEntity.ok(record);
    }

    /**
     * 러닝 기록 삭제
     *
     * DELETE /api/running-records/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();
        log.info("[RunningRecordController] 러닝 기록 삭제 - ID: {}, Email: {}", id, email);

        runningRecordService.deleteRecord(email, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 러닝 통계 조회
     *
     * GET /api/running-records/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<RunningRecordService.RunningStatistics> getStatistics(
            Authentication authentication) {

        String email = authentication.getName();
        log.info("[RunningRecordController] 러닝 통계 조회 - Email: {}", email);

        RunningRecordService.RunningStatistics statistics =
                runningRecordService.getStatistics(email);
        return ResponseEntity.ok(statistics);
    }
}
