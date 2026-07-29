-- Star / favorite flag for contact inbox
ALTER TABLE contact_messages
  ADD COLUMN is_starred TINYINT(1) NOT NULL DEFAULT 0 AFTER is_hidden,
  ADD KEY idx_contact_messages_portfolio_starred (portfolio_id, is_starred, created_at);
