CREATE TABLE IF NOT EXISTS user_uploads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  public_url VARCHAR(512) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/webp',
  purpose ENUM('avatar','project') NOT NULL DEFAULT 'project',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_uploads_object_key (object_key),
  KEY idx_user_uploads_user_id (user_id),
  CONSTRAINT fk_user_uploads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
