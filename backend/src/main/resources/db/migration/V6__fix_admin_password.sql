-- Fix: BCrypt-Hash für admin123 korrigieren (V5 hatte den Hash für "password")
UPDATE app_users
SET password_hash = '$2b$12$ZgrLjYH8fhnatbUNVTcU3.so5pYwJPQvTMdt1WPNcAM.ZxRhvBz3m'
WHERE email = 'admin@firma.de';
