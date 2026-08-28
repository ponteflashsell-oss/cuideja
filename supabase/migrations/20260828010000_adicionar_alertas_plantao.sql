CREATE TABLE public.alertas_plantao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem text NOT NULL CHECK (char_length(mensagem) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  lido_em timestamptz
);

CREATE INDEX alertas_plantao_contrato_created_idx
  ON public.alertas_plantao (contrato_id, created_at DESC);

ALTER TABLE public.alertas_plantao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participantes veem alertas do plantao"
ON public.alertas_plantao FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = contrato_id
      AND (c.familia_id = auth.uid() OR c.cuidadora_id = auth.uid())
  )
);

CREATE POLICY "Cuidadora cria alertas do plantao"
ON public.alertas_plantao FOR INSERT TO authenticated
WITH CHECK (
  criado_por = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = contrato_id
      AND c.cuidadora_id = auth.uid()
      AND c.status = 'ativo'
  )
);

CREATE POLICY "Familia marca alerta como lido"
ON public.alertas_plantao FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contratos c
    WHERE c.id = contrato_id AND c.familia_id = auth.uid()
  )
)
WITH CHECK (lido_em IS NOT NULL);
