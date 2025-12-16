package io.jongbeom.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class DirectionsRequest {
    private String start; // "경도,위도" 형식
    private String goal;  // "경도,위도" 형식
    private List<String> waypoints; // ["경도,위도", "경도,위도", ...] 형식
    private String option; // trafast, tracomfort, traoptimal
}
