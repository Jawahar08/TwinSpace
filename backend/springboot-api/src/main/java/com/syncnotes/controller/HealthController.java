package com.syncnotes.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping({"/", "/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "TwinSpace Realtime Sync API",
            "version", "1.0.0"
        ));
    }
}
