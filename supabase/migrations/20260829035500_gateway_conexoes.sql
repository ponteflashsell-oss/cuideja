CREATE TABLE IF NOT EXISTS public.gateway_conexoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'supabase',
  url text NOT NULL,
  chave text NOT NULL,
  ativo boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'nao_testado',
  mensagem text,
  ultimo_teste_em timestamptz,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gateway_conexoes TO authenticated;
GRANT ALL ON public.gateway_conexoes TO service_role;

ALTER TABLE public.gateway_conexoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerenciam conexoes de gateway" ON public.gateway_conexoes;
CREATE POLICY "Admins gerenciam conexoes de gateway" ON public.gateway_conexoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
