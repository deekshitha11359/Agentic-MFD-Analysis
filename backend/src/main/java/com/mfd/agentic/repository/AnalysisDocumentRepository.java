package com.mfd.agentic.repository;

import com.mfd.agentic.model.AnalysisDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface AnalysisDocumentRepository extends JpaRepository<AnalysisDocument, Long> {
    Optional<AnalysisDocument> findByIdAndUserId(Long id, Long userId);

    List<AnalysisDocument> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);

    Optional<AnalysisDocument> findFirstByUserIdAndStatusNotOrderByCreatedAtDescIdDesc(
            Long userId,
            String excludedStatus
    );

    @Modifying
    @Transactional
    @Query("delete from AnalysisDocument document where document.id = :documentId and document.userId = :userId")
    void deleteByIdAndUserId(@Param("documentId") Long documentId, @Param("userId") Long userId);
}
