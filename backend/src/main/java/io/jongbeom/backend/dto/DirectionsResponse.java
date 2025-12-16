package io.jongbeom.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DirectionsResponse {
    private List<List<Double>> path; // [경도, 위도] 배열
    private int distance; // 미터
    private int duration; // 초
}
