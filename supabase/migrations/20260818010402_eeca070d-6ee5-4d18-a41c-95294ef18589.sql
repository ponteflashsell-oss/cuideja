ALTER TABLE public.verificacoes
  ADD COLUMN IF NOT EXISTS selfie_path text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS documento_path text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS revisao_manual boolean NOT NULL DEFAULT false;

CREATE POLICY "Cuidadoras enviam as proprias fotos de verificacao"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verificacoes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Cuidadoras veem as proprias fotos de verificacao"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'verificacoes' AND (storage.foldername(name))[1] = auth.uid()::text);