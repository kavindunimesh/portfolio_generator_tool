-- Soft-hide for contact inbox (replaces hard delete)
ALTER TABLE contact_messages
  ADD COLUMN is_hidden TINYINT(1) NOT NULL DEFAULT 0 AFTER is_read,
  ADD KEY idx_contact_messages_portfolio_hidden (portfolio_id, is_hidden, created_at);
