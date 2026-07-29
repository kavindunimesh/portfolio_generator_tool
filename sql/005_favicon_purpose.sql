-- Allow favicon uploads in user_uploads.purpose
ALTER TABLE user_uploads
  MODIFY COLUMN purpose ENUM('avatar','project','logo','favicon') NOT NULL DEFAULT 'project';
