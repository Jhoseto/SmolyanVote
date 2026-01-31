-- Migration: Change last_message_preview from VARCHAR to TEXT
-- Reason: Need to support message previews up to 3000 chars
-- Fix: First drop any indexes on the column, then alter to TEXT
-- Author: Antigravity
-- Date: 2026-01-31

-- Select the correct database
USE railway;

-- Step 1: Show current indexes on the table
SHOW INDEX FROM sv_conversations WHERE Column_name = 'last_message_preview';

-- Step 2: Drop the index on last_message_preview if it exists
-- Note: Replace 'index_name_here' with the actual index name from Step 1
-- Common index names: idx_last_message_preview, last_message_preview, etc.
-- If you see an index in Step 1 output, uncomment and replace the name below:

-- ALTER TABLE sv_conversations DROP INDEX idx_last_message_preview;
-- OR try these common names if above doesn't work:
-- ALTER TABLE sv_conversations DROP INDEX last_message_preview;

-- Step 3: Alter the column to TEXT type (unlimited length)
ALTER TABLE sv_conversations 
MODIFY COLUMN last_message_preview TEXT;

-- Step 4: Verify the change
DESCRIBE sv_conversations;

-- Success!
SELECT 'Migration completed successfully! Restart backend now.' AS status;
