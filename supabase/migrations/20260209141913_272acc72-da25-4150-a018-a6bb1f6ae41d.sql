
-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('user-uploads', 'user-uploads', false, 52428800);

-- Users can upload to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
