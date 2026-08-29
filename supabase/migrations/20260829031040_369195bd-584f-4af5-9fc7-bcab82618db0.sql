-- 9. ÍNDICES --------------------------------------------------
create index if not exists documentos_user_id_idx on public.documentos (user_id);
create index if not exists verificacoes_user_id_idx on public.verificacoes (user_id, created_at desc);
create index if not exists mensagens_conversa_created_idx on public.mensagens (conversa_id, created_at);
create index if not exists mensagens_conversa_participantes_idx
  on public.mensagens_conversa (familia_id, cuidadora_id, created_at);
create index if not exists propostas_familia_idx on public.propostas (familia_id, created_at desc);
create index if not exists propostas_cuidadora_idx on public.propostas (cuidadora_id, status, created_at desc);
create index if not exists contratos_familia_idx on public.contratos (familia_id, created_at desc);
create index if not exists contratos_cuidadora_idx on public.contratos (cuidadora_id, created_at desc);
create index if not exists alertas_plantao_contrato_created_idx
  on public.alertas_plantao (contrato_id, created_at desc);
create index if not exists admin_auditoria_created_at_idx on public.admin_auditoria (created_at desc);

-- 10. TRIGGERS DE updated_at ----------------------------------
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();
create trigger update_verificacoes_updated_at before update on public.verificacoes
  for each row execute function public.update_updated_at_column();
create trigger update_documentos_updated_at before update on public.documentos
  for each row execute function public.update_updated_at_column();
create trigger update_conversas_updated_at before update on public.conversas
  for each row execute function public.update_updated_at_column();
create trigger trigger_propostas_updated_at before update on public.propostas
  for each row execute function public.update_updated_at_column();
create trigger update_contratos_updated_at before update on public.contratos
  for each row execute function public.update_updated_at_column();

-- 11. CRIAÇÃO AUTOMÁTICA DE PERFIL AO CADASTRAR ---------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, cidade, tipo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'cidade', ''),
    case when new.raw_user_meta_data ->> 'tipo' = 'familia' then 'familia' else 'cuidadora' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Restringe execução direta de has_role (usada apenas dentro de policies)
revoke execute on function public.has_role(uuid, public.app_role) from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 12. STORAGE POLICIES ----------------------------------------
create policy "Usuario envia arquivos da propria verificacao" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verificacoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Usuario le arquivos da propria verificacao" on storage.objects
  for select to authenticated
  using (bucket_id = 'verificacoes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Admin le arquivos de verificacao" on storage.objects
  for select to authenticated
  using (bucket_id = 'verificacoes' and public.has_role(auth.uid(), 'admin'));