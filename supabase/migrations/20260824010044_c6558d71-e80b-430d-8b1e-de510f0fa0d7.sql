CREATE TABLE public.contratos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  familia_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cuidadora_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_por uuid NOT NULL,
  familia_nome text NOT NULL DEFAULT '',
  familia_cpf text NOT NULL DEFAULT '',
  familia_cidade text NOT NULL DEFAULT '',
  familia_bairro text NOT NULL DEFAULT '',
  familia_verificada boolean NOT NULL DEFAULT false,
  cuidadora_nome text NOT NULL DEFAULT '',
  cuidadora_cpf text NOT NULL DEFAULT '',
  cuidadora_cidade text NOT NULL DEFAULT '',
  cuidadora_verificada boolean NOT NULL DEFAULT false,
  descricao_cuidado text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  regime text NOT NULL DEFAULT 'plantao12',
  data_inicio date NOT NULL,
  data_fim date,
  hora_inicio text NOT NULL DEFAULT '',
  hora_fim text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  taxa_percentual numeric NOT NULL DEFAULT 10,
  observacoes text NOT NULL DEFAULT '',
  termo_texto text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'aguardando',
  familia_aceite_em timestamp with time zone,
  familia_aceite_nome text NOT NULL DEFAULT '',
  cuidadora_aceite_em timestamp with time zone,
  cuidadora_aceite_nome text NOT NULL DEFAULT '',
  recusado_por uuid,
  motivo_recusa text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partes veem os proprios contratos"
ON public.contratos FOR SELECT TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE POLICY "Admins veem todos os contratos"
ON public.contratos FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partes criam contratos"
ON public.contratos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = criado_por AND (auth.uid() = familia_id OR auth.uid() = cuidadora_id));

CREATE POLICY "Partes atualizam os proprios contratos"
ON public.contratos FOR UPDATE TO authenticated
USING (auth.uid() = familia_id OR auth.uid() = cuidadora_id)
WITH CHECK (auth.uid() = familia_id OR auth.uid() = cuidadora_id);

CREATE TRIGGER update_contratos_updated_at
BEFORE UPDATE ON public.contratos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX contratos_familia_idx ON public.contratos (familia_id, created_at DESC);
CREATE INDEX contratos_cuidadora_idx ON public.contratos (cuidadora_id, created_at DESC);