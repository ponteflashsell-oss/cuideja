CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'documento_oficial',
  nome_arquivo text NOT NULL DEFAULT '',
  caminho text NOT NULL,
  mime text NOT NULL DEFAULT '',
  tamanho bigint NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT 'upload',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios enviam os proprios documentos" ON public.documentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios veem os proprios documentos" ON public.documentos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins veem todos os documentos" ON public.documentos
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX documentos_user_id_idx ON public.documentos (user_id);

CREATE TABLE public.admin_auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid,
  acao text NOT NULL,
  caminho text NOT NULL DEFAULT '',
  detalhe text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_auditoria TO authenticated;
GRANT ALL ON public.admin_auditoria TO service_role;

ALTER TABLE public.admin_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem a auditoria" ON public.admin_auditoria
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX admin_auditoria_created_at_idx ON public.admin_auditoria (created_at DESC);