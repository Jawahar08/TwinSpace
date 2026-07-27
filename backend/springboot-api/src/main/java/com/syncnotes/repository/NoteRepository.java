package com.syncnotes.repository;

import com.syncnotes.entity.NoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<NoteEntity, UUID> {

    List<NoteEntity> findByUserIdAndDeletedFalseOrderByPinnedDescUpdatedAtDesc(UUID userId);

    List<NoteEntity> findByUserIdAndArchivedFalseAndDeletedFalseOrderByPinnedDescUpdatedAtDesc(UUID userId);

    List<NoteEntity> findByUserIdAndArchivedTrueAndDeletedFalseOrderByUpdatedAtDesc(UUID userId);

    List<NoteEntity> findByUserIdAndDeletedTrueOrderByUpdatedAtDesc(UUID userId);

    Optional<NoteEntity> findByUserIdAndId(UUID userId, UUID id);

    Optional<NoteEntity> findByUserIdAndDeviceIdAndClientMutationId(UUID userId, String deviceId, String clientMutationId);

    @Query("SELECT DISTINCT n FROM NoteEntity n WHERE n.userId = :userId AND n.deleted = false AND " +
           "(LOWER(n.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(n.content) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " n.id IN (SELECT a.noteId FROM AttachmentEntity a WHERE a.userId = :userId AND a.deleted = false AND LOWER(a.originalName) LIKE LOWER(CONCAT('%', :query, '%')))) " +
           "ORDER BY n.updatedAt DESC")
    List<NoteEntity> searchNotes(@Param("userId") UUID userId, @Param("query") String query);

    List<NoteEntity> findByUserId(UUID userId);
}
