CREATE TABLE IF NOT EXISTS contact_messages (
  id CHAR(36) NOT NULL PRIMARY KEY,
  portfolio_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(200) NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  ip_hash VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_contact_messages_portfolio_created (portfolio_id, created_at),
  KEY idx_contact_messages_portfolio_unread (portfolio_id, is_read, created_at),
  KEY idx_contact_messages_portfolio_hidden (portfolio_id, is_hidden, created_at),
  CONSTRAINT fk_contact_messages_portfolio
    FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
