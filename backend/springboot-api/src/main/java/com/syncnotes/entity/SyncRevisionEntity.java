package com.syncnotes.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sync_revisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncRevisionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "entity_type", nullable = false)
    private String entityType; // NOTE, ATTACHMENT

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(nullable = false)
    private String operation; // CREATE, UPDATE, DELETE

    @Column(nullable = false)
    private long version;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload; // Serialized JSON payload

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "client_mutation_id", nullable = false)
    private String clientMutationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
