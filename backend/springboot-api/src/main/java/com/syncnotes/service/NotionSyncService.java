package com.syncnotes.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;

@Service
@Slf4j
public class NotionSyncService {

    @Value("${notion.api-key:}")
    private String notionApiKey;

    @Value("${notion.database-id:}")
    private String notionDatabaseId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Asynchronously records a device pairing session or user sign-in to Notion Database.
     */
    @Async
    public void recordPairingSessionInNotion(String email, String pairingCode, String deviceType) {
        if (notionApiKey == null || notionApiKey.isBlank() || notionDatabaseId == null || notionDatabaseId.isBlank()) {
            log.info("Notion Database API Key or Database ID not configured. Skipping Notion cloud sync. Email: {}", email);
            return;
        }

        try {
            String jsonPayload = buildNotionPagePayload(email, pairingCode, deviceType);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.notion.com/v1/pages"))
                    .header("Authorization", "Bearer " + notionApiKey.trim())
                    .header("Notion-Version", "2022-06-28")
                    .header("Content-Type", "application.json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 || response.statusCode() == 201) {
                log.info("Successfully synced pairing code [{}] to Notion Database for user [{}]", pairingCode, email);
            } else {
                log.warn("Notion API returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to sync pairing session to Notion Database: {}", e.getMessage());
        }
    }

    private String buildNotionPagePayload(String email, String pairingCode, String deviceType) {
        String safeCode = pairingCode != null ? pairingCode : "MANUAL";
        String safeDevice = deviceType != null ? deviceType : "Windows";
        String nowIso = Instant.now().toString();

        return """
        {
          "parent": { "database_id": "%s" },
          "properties": {
            "Pairing Code": {
              "title": [ { "text": { "content": "%s" } } ]
            },
            "User Email": {
              "email": "%s"
            },
            "Linked Devices": {
              "multi_select": [ { "name": "%s" } ]
            },
            "Status": {
              "select": { "name": "ACTIVE" }
            },
            "Created At": {
              "date": { "start": "%s" }
            }
          }
        }
        """.formatted(notionDatabaseId.trim(), escapeJson(safeCode), escapeJson(email), escapeJson(safeDevice), nowIso);
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
