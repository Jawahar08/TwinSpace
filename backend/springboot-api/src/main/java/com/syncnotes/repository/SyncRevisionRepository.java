package com.syncnotes.repository;

import com.syncnotes.entity.SyncRevisionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyncRevisionRepository extends JpaRepository<SyncRevisionEntity, Long> {

    List<SyncRevisionEntity> findByUserIdAndIdGreaterThanOrderByIdAsc(UUID userId, Long lastRevision);

    Optional<SyncRevisionEntity> findTopByUserIdOrderByIdDesc(UUID userId);
}
