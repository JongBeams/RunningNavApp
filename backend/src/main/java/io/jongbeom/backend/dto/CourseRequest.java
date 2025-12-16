package io.jongbeom.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRequest {

    @NotBlank(message = "코스 이름은 필수입니다.")
    private String name;

    @NotBlank(message = "경로 정보는 필수입니다.")
    private String routeGeoJson; // GeoJSON LineString

    @NotBlank(message = "경유지 정보는 필수입니다.")
    private String waypointsGeoJson; // GeoJSON MultiPoint

    @NotNull(message = "거리 정보는 필수입니다.")
    @Min(value = 0, message = "거리는 0 이상이어야 합니다.")
    private Integer distance;

    @NotNull(message = "예상 시간 정보는 필수입니다.")
    @Min(value = 0, message = "예상 시간은 0 이상이어야 합니다.")
    private Integer duration;
}
