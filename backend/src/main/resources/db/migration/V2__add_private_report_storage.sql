ALTER TABLE users
    ADD COLUMN phone VARCHAR(32) NULL,
    ADD COLUMN account_type VARCHAR(60) NULL;

ALTER TABLE documents
    ADD COLUMN report_json LONGTEXT NULL;

UPDATE documents
SET report_json = '{}'
WHERE report_json IS NULL;

ALTER TABLE documents
    MODIFY COLUMN report_json LONGTEXT NOT NULL,
    ADD INDEX idx_documents_user_created (user_id, created_at, id);

UPDATE users
SET role = 'MFD_DISTRIBUTOR'
WHERE role IS NULL;

ALTER TABLE users
    MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'MFD_DISTRIBUTOR';

UPDATE documents
SET status = 'LEGACY_UNAVAILABLE'
WHERE report_json = '{}';

UPDATE documents
SET status = 'LEGACY_UNAVAILABLE'
WHERE status IS NULL;

ALTER TABLE documents
    MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED';
