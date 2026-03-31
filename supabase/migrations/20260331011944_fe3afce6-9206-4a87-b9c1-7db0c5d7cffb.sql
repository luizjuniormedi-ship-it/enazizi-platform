
-- Create public bucket for question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from question-images bucket
CREATE POLICY "Public read access for question images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

-- Allow authenticated users to upload to question-images
CREATE POLICY "Authenticated upload to question images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');
