-- Fix: BCrypt-Hash für admin123 korrigieren (V5 hatte den Hash für "password")
UPDATE app_users
SET password_hash = '$2a$10$MbN8CAyjdo5bJpxl/8BLies8MCrKgFazrc6PBsiAdlolGJcAQCfC6'
WHERE email = 'admin@firma.de';
