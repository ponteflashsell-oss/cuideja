CREATE TABLE public.gateway_pagamento_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provedor text NOT NULL DEFAULT 'infinitepay',
  identificador text NOT NULL,
  titular text,
  documento text,
  ativo boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'nao_validado',
  mensagem text,
  validado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gateway_pagamento_contas TO authenticated;
GRANT ALL ON public.gateway_pagamento_contas TO service_role;
ALTER TABLE public.gateway_pagamento_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam contas de gateway" ON public.gateway_pagamento_contas
FOR ALL TO authenticated
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));