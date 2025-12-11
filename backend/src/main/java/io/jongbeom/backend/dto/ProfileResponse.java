package io.jongbeom.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {

    private UUID id;
    private String email;
    private String fullName;
    private String phone;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private Boolean isActive;
}
