-- 8. POLICIES -------------------------------------------------

-- profiles
create policy "Cuidadoras podem ver o proprio perfil" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Cuidadoras podem criar o proprio perfil" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "Cuidadoras podem editar o proprio perfil" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins veem todos os perfis" on public.profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins editam todos os perfis" on public.profiles
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "Usuarios veem os proprios papeis" on public.user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- verificacoes
create policy "Cuidadoras veem as proprias verificacoes" on public.verificacoes
  for select to authenticated using (auth.uid() = user_id);
create policy "Cuidadoras criam as proprias verificacoes" on public.verificacoes
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins veem todas as verificacoes" on public.verificacoes
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins atualizam verificacoes" on public.verificacoes
  for update to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- documentos
create policy "Usuarios veem os proprios documentos" on public.documentos
  for select to authenticated using (auth.uid() = user_id);
create policy "Usuarios enviam os proprios documentos" on public.documentos
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins veem todos os documentos" on public.documentos
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- conversas
create policy "Participantes veem suas conversas" on public.conversas
  for select to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Familias iniciam conversas" on public.conversas
  for insert to authenticated with check (auth.uid() = familia_id);
create policy "Participantes atualizam suas conversas" on public.conversas
  for update to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id)
  with check (auth.uid() = familia_id or auth.uid() = cuidadora_id);

-- mensagens
create policy "Participantes veem mensagens" on public.mensagens
  for select to authenticated using (exists (
    select 1 from public.conversas c
    where c.id = mensagens.conversa_id
      and (c.familia_id = auth.uid() or c.cuidadora_id = auth.uid())));
create policy "Participantes enviam mensagens" on public.mensagens
  for insert to authenticated with check (remetente_id = auth.uid() and exists (
    select 1 from public.conversas c
    where c.id = mensagens.conversa_id
      and (c.familia_id = auth.uid() or c.cuidadora_id = auth.uid())));

-- mensagens_conversa
create policy "Participantes veem mensagens da conversa" on public.mensagens_conversa
  for select to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Participantes enviam mensagens da conversa" on public.mensagens_conversa
  for insert to authenticated
  with check (remetente_id = auth.uid() and (auth.uid() = familia_id or auth.uid() = cuidadora_id));

-- propostas
create policy "Familia ve suas propostas" on public.propostas
  for select to authenticated using (auth.uid() = familia_id);
create policy "Cuidadora ve propostas recebidas" on public.propostas
  for select to authenticated using (auth.uid() = cuidadora_id);
create policy "Familia cria proposta" on public.propostas
  for insert to authenticated with check (auth.uid() = familia_id);
create policy "Participantes atualizam proposta" on public.propostas
  for update to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id)
  with check (auth.uid() = familia_id or auth.uid() = cuidadora_id);

-- contratos
create policy "Partes veem os proprios contratos" on public.contratos
  for select to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Partes criam contratos" on public.contratos
  for insert to authenticated
  with check (auth.uid() = criado_por and (auth.uid() = familia_id or auth.uid() = cuidadora_id));
create policy "Partes atualizam os proprios contratos" on public.contratos
  for update to authenticated using (auth.uid() = familia_id or auth.uid() = cuidadora_id)
  with check (auth.uid() = familia_id or auth.uid() = cuidadora_id);
create policy "Admins veem todos os contratos" on public.contratos
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- alertas_plantao
create policy "Participantes veem alertas do plantao" on public.alertas_plantao
  for select to authenticated using (exists (
    select 1 from public.contratos c
    where c.id = alertas_plantao.contrato_id
      and (c.familia_id = auth.uid() or c.cuidadora_id = auth.uid())));
create policy "Cuidadora cria alertas do plantao" on public.alertas_plantao
  for insert to authenticated with check (criado_por = auth.uid() and exists (
    select 1 from public.contratos c
    where c.id = alertas_plantao.contrato_id
      and c.cuidadora_id = auth.uid() and c.status = 'ativo'));
create policy "Familia marca alerta como lido" on public.alertas_plantao
  for update to authenticated using (exists (
    select 1 from public.contratos c
    where c.id = alertas_plantao.contrato_id and c.familia_id = auth.uid()))
  with check (lido_em is not null);

-- admin_auditoria
create policy "Admins veem a auditoria" on public.admin_auditoria
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));