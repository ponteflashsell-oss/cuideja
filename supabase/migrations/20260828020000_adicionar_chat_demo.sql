CREATE TABLE public.mensagens_conversa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mensagens_conversa_participantes_check CHECK (remetente_id = familia_id OR remetente_id = cuidadora_id)
);

CREATE INDEX mensagens_conversa_participantes_idx
  ON public.mensagens_conversa (familia_id, cuidadora_id, created_at);

ALTER TABLE public.mensagens_conversa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem mensagens da conversa"
ON public.mensagens_conversa FOR SELECT TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE POLICY "Participantes enviam mensagens da conversa"
ON public.mensagens_conversa FOR INSERT TO authenticated
WITH CHECK (
  remetente_id = auth.uid()
  AND (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
);
