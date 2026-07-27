package com.syncnotes.repository;

import com.syncnotes.entity.AttachmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<AttachmentEntity, UUID> {

    List<AttachmentEntity> findByUserIdAndNoteIdAndDeletedFalse(UUID userId, UUID noteId);

    Optional<AttachmentEntity> findByUserIdAndId(UUID userId, UUID id);

    List<AttachmentEntity> findByUserId(UUID userId);
}
