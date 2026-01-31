-- Add attachments column to chalk_chat_messages for image support
ALTER TABLE chalk_chat_messages
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN chalk_chat_messages.attachments IS 'Array of attachment objects: [{url: string, type: string, name: string}]';