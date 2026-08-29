CREATE TABLE public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_servico date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  valor_proposto numeric(10,2) NOT NULL CHECK (valor_proposto > 0),
  observacao text NOT NULL DEFAULT '' CHECK (char_length(trim(observacao)) <= 140),
  status text NOT NULL DEFAULT 'pendente_cuidadora' CHECK (
    status IN ('pendente_cuidadora', 'contraproposta', 'pendente_familia', 'aceita', 'recusada', 'expirada')
  ),
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX propostas_familia_idx
  ON public.propostas (familia_id, created_at DESC);

CREATE INDEX propostas_cuidadora_idx
  ON public.propostas (cuidadora_id, status, created_at DESC);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Familia ve suas propostas"
ON public.propostas FOR SELECT TO authenticated
USING (auth.uid() = familia_id);

CREATE POLICY "Cuidadora ve propostas recebidas"
ON public.propostas FOR SELECT TO authenticated
USING (auth.uid() = cuidadora_id);

CREATE POLICY "Familia cria proposta"
ON public.propostas FOR INSERT TO authenticated
WITH CHECK (auth.uid() = familia_id);

CREATE POLICY "Participantes atualizam proposta"
ON public.propostas FOR UPDATE TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
WITH CHECK (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

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

CREATE TRIGGER trigger_propostas_updated_at
BEFORE UPDATE ON public.propostas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
