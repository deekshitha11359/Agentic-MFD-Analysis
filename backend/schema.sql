-- Legacy MySQL bootstrap schema. Flyway V2 adds private report/account metadata.
CREATE DATABASE IF NOT EXISTS mfd_brokerage_ai;
USE mfd_brokerage_ai;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    arn_number VARCHAR(100) NOT NULL UNIQUE,
    euin_number VARCHAR(100),
    firm_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'MFD_DISTRIBUTOR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Documents Master Table
CREATE TABLE IF NOT EXISTS documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- PDF, XLSX, CSV, DBF, PNG, JPG
    detected_source VARCHAR(100), -- CAMS, KFintech, Zerodha, Groww, ICICI Direct, AMC
    file_size_bytes BIGINT,
    storage_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'PROCESSING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Document Extractions Table
CREATE TABLE IF NOT EXISTS document_extractions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    raw_column_names JSON,
    total_records_extracted INT DEFAULT 0,
    extraction_metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 4. Schemes Table
CREATE TABLE IF NOT EXISTS schemes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme_code VARCHAR(100),
    scheme_name VARCHAR(255) NOT NULL,
    amc_code VARCHAR(100),
    category VARCHAR(100),
    isin VARCHAR(50),
    latest_nav DECIMAL(15, 4),
    nav_date DATE
);

-- 5. Folios & Investors Table
CREATE TABLE IF NOT EXISTS folios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    investor_name VARCHAR(255) NOT NULL,
    pan VARCHAR(20),
    folio_number VARCHAR(100) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    folio_id BIGINT,
    scheme_id BIGINT,
    txn_number VARCHAR(100),
    txn_type VARCHAR(100), -- SIP, Lumpsum, Redemption, Switch
    txn_date DATE,
    investment_amount DECIMAL(18, 2),
    units DECIMAL(18, 4),
    nav DECIMAL(15, 4),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 7. Brokerage Records Table
CREATE TABLE IF NOT EXISTS brokerage_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    transaction_id BIGINT,
    brkage_type VARCHAR(100), -- Trail Regular, Upfront, B30
    brkage_rate DECIMAL(8, 4),
    brkage_amt DECIMAL(18, 2) NOT NULL,
    avg_assets DECIMAL(18, 2),
    am_rate DECIMAL(8, 4),
    cam_rate DECIMAL(8, 4),
    mam_rate DECIMAL(8, 4),
    am_comm DECIMAL(18, 2),
    cam_comm DECIMAL(18, 2),
    mam_comm DECIMAL(18, 2),
    gst_info VARCHAR(255),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 8. Return Analysis Table
CREATE TABLE IF NOT EXISTS return_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    has_sufficient_data BOOLEAN DEFAULT FALSE,
    invested_amount DECIMAL(18, 2),
    current_value DECIMAL(18, 2),
    profit_loss DECIMAL(18, 2),
    absolute_return_pct DECIMAL(10, 2),
    xirr DECIMAL(10, 2),
    cagr DECIMAL(10, 2),
    calculation_basis TEXT,
    notice_message TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 9. AI Analysis & Insights Table
CREATE TABLE IF NOT EXISTS ai_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    insight_type VARCHAR(100), -- CONCENTRATION, REVENUE, TAX_ALPHA, ANOMALY
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_support TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 10. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    tag VARCHAR(100),
    observation TEXT NOT NULL,
    action_item TEXT NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 11. Reports & Shares Table
CREATE TABLE IF NOT EXISTS reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    report_json JSON NOT NULL,
    pdf_path VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_shares (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id BIGINT NOT NULL,
    share_token VARCHAR(255) NOT NULL UNIQUE,
    share_channel VARCHAR(50), -- EMAIL, WHATSAPP, LINK
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- 12. Chat Sessions & Messages Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    sender VARCHAR(20) NOT NULL, -- USER or AI
    message TEXT NOT NULL,
    context_used TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);
