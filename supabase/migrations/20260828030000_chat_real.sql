CREATE TABLE public.conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assunto text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'encerrada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (familia_id, cuidadora_id)
);

CREATE TABLE public.mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.conversas(id) ON DELETE CASCADE,
  remetente_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (char_length(trim(mensagem)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mensagens_conversa_created_idx ON public.mensagens (conversa_id, created_at);
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem suas conversas" ON public.conversas FOR SELECT TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id);
CREATE POLICY "Familias iniciam conversas" ON public.conversas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = familia_id);
CREATE POLICY "Participantes atualizam suas conversas" ON public.conversas FOR UPDATE TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
WITH CHECK (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE POLICY "Participantes veem mensagens" ON public.mensagens FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = conversa_id AND (c.familia_id = auth.uid() OR c.cuidadora_id = auth.uid())));
CREATE POLICY "Participantes enviam mensagens" ON public.mensagens FOR INSERT TO authenticated
WITH CHECK (remetente_id = auth.uid() AND EXISTS (SELECT 1 FROM public.conversas c WHERE c.id = conversa_id AND (c.familia_id = auth.uid() OR c.cuidadora_id = auth.uid())));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversas_updated_at
BEFORE UPDATE ON public.conversas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
