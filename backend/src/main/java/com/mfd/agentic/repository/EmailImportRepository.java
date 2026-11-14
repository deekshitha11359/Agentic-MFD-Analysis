package com.mfd.agentic.repository;

import com.mfd.agentic.model.EmailImport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailImportRepository extends JpaRepository<EmailImport, Long> {
    boolean existsByUserIdAndProviderAndMessageIdAndAttachmentId(
            Long userId, String provider, String messageId, String attachmentId
    );
    Optional<EmailImport> findByUserIdAndProviderAndMessageIdAndAttachmentId(
            Long userId, String provider, String messageId, String attachmentId
    );
    boolean existsByUserIdAndFileSha256(Long userId, String fileSha256);
    Optional<EmailImport> findByIdAndUserId(Long id, Long userId);
    List<EmailImport> findTop50ByUserIdOrderByImportedAtDesc(Long userId);
}
