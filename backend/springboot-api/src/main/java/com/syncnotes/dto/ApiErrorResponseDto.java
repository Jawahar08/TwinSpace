package com.syncnotes.dto;

import lombok.*;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiErrorResponseDto {
    private String code;
    private String message;
    private Instant timestamp;
    private Map<String, Object> details;
}
