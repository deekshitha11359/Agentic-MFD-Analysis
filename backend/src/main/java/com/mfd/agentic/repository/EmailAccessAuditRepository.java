package com.mfd.agentic.repository;

import com.mfd.agentic.model.EmailAccessAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailAccessAuditRepository extends JpaRepository<EmailAccessAudit, Long> {
}
