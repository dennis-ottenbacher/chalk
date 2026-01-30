-- Storage bucket for chat attachments
-- Run this in Supabase SQL Editor or via migration

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments',
    'chat-attachments',
    true,  -- Public bucket for easy access
    10485760,  -- 10MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for chat-attachments bucket

-- Allow authenticated chat-eligible users to upload
CREATE POLICY "Chat users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_chat_eligible()
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
);

-- Allow authenticated users to view attachments from their organization
CREATE POLICY "Users can view their org attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public access for reading (since bucket is public)
CREATE POLICY "Public read access for chat attachments" ON storage.objects FOR
SELECT TO public USING (
        bucket_id = 'chat-attachments'
    );