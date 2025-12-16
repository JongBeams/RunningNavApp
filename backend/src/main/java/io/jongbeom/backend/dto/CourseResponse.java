package io.jongbeom.backend.dto;

import io.jongbeom.backend.entity.Course;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.locationtech.jts.io.geojson.GeoJsonWriter;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponse {

    private String id;
    private String name;
    private String routeGeoJson; // GeoJSON LineString
    private String waypointsGeoJson; // GeoJSON MultiPoint
    private Integer distance;
    private Integer duration;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Boolean isActive;

    public static CourseResponse from(Course course) {
        GeoJsonWriter writer = new GeoJsonWriter();

        return CourseResponse.builder()
                .id(course.getId().toString())
                .name(course.getName())
                .routeGeoJson(course.getRoute() != null ? writer.write(course.getRoute()) : null)
                .waypointsGeoJson(course.getWaypoints() != null ? writer.write(course.getWaypoints()) : null)
                .distance(course.getDistance())
                .duration(course.getDuration())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .isActive(course.getIsActive())
                .build();
    }
}
