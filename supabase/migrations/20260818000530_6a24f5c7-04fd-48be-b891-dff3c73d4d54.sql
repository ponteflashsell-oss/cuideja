CREATE TABLE public.verificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'em_analise',
  nome_documento text NOT NULL DEFAULT '',
  cpf text NOT NULL DEFAULT '',
  data_nascimento text NOT NULL DEFAULT '',
  tipo_documento text NOT NULL DEFAULT '',
  cpf_valido boolean NOT NULL DEFAULT false,
  face_confere boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0,
  observacoes text NOT NULL DEFAULT '',
  antecedentes_status text NOT NULL DEFAULT 'nao_consultado',
  antecedentes_dados jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.verificacoes TO authenticated;
GRANT ALL ON public.verificacoes TO service_role;

ALTER TABLE public.verificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cuidadoras veem as proprias verificacoes"
ON public.verificacoes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Cuidadoras criam as proprias verificacoes"
ON public.verificacoes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE INDEX verificacoes_user_id_idx ON public.verificacoes (user_id, created_at DESC);

CREATE TRIGGER update_verificacoes_updated_at
BEFORE UPDATE ON public.verificacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();