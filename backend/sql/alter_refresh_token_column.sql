-- Migration: Increase refresh_token column size from VARCHAR(255) to VARCHAR(512)
-- Reason: JWT Refresh Token exceeds 255 characters
-- Date: 2025-12-12

ALTER TABLE profiles
ALTER COLUMN refresh_token TYPE VARCHAR(512);
