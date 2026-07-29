CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS portfolios (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  user_route VARCHAR(64) NULL,
  template_slug VARCHAR(64) NOT NULL DEFAULT 'minimal',
  full_name VARCHAR(120) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(40) NULL,
  whatsapp VARCHAR(40) NULL,
  headline VARCHAR(255) NULL,
  bio TEXT NULL,
  location VARCHAR(120) NULL,
  avatar_url VARCHAR(512) NULL,
  primary_color VARCHAR(32) NULL DEFAULT '#0F766E',
  theme_mode VARCHAR(16) NULL DEFAULT 'light',
  socials_json JSON NULL,
  skills_json JSON NULL,
  projects_json JSON NULL,
  payload_json JSON NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_portfolios_user_id (user_id),
  UNIQUE KEY uq_portfolios_user_route (user_route),
  KEY idx_portfolios_published_route (is_published, user_route),
  CONSTRAINT fk_portfolios_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS download_jobs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  portfolio_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status ENUM('processing','ready','failed') NOT NULL DEFAULT 'processing',
  zip_filename VARCHAR(255) NULL,
  zip_path VARCHAR(512) NULL,
  zip_size_bytes INT NULL,
  error_message TEXT NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_download_jobs_expires (expires_at),
  CONSTRAINT fk_download_jobs_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE,
  CONSTRAINT fk_download_jobs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_uploads (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  public_url VARCHAR(512) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/webp',
  purpose ENUM('avatar','project','logo','favicon') NOT NULL DEFAULT 'project',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_uploads_object_key (object_key),
  KEY idx_user_uploads_user_id (user_id),
  CONSTRAINT fk_user_uploads_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
