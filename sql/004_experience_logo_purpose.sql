-- Allow company logo uploads for experience entries
ALTER TABLE user_uploads
  MODIFY COLUMN purpose ENUM('avatar','project','logo') NOT NULL DEFAULT 'project';
