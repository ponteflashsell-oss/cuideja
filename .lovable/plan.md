# Cadastro completo + dados reais em busca, vagas e ganhos

Duas frentes: completar as informações de cadastro (identificação, dossiê da família, dossiê da cuidadora) e acabar com os dados de exemplo que hoje aparecem como se fossem reais.

## 1. Identificação básica (todos)

Já existe: CPF, nome completo, data de nascimento.
A acrescentar:

- Telefone/WhatsApp obrigatório, com máscara, pedido na criação da conta (passo 2) e editável no perfil.
- Aviso curto explicando que o número é usado para alertas, confirmações e emergências.

## 2. Dossiê do cliente / família

Nova seção "Endereço do atendimento":

- CEP (com busca automática de rua/bairro/cidade), rua, número, complemento, bairro, cidade, ponto de referência.
- Contato de emergência secundário: nome e telefone.

Nova seção "Perfil do paciente e rotina":

- Idade do paciente.
- Grau de mobilidade: acamado, cadeirante, mobilidade reduzida, autônomo.
- Condições de saúde (as marcações que já existem, mantidas).
- Rotina de medicação e cuidados.

A foto de conferência (rosto com documento) já existe e continua como está.

## 3. Dossiê da cuidadora

- Foto de perfil real: hoje o botão da câmera só mostra um aviso. Passa a enviar a imagem, guardar e exibir no catálogo de busca.
- Chave Pix (tipo + chave) para repasse dos plantões.
- Documentação: RG/CNH frente e verso (hoje é um envio único) e certidão de antecedentes criminais.
- Qualificações: especialidades (já existem), cursos/certificações com envio de arquivo e tempo de experiência em anos.

## 4. Nada mais de dados de exemplo

Hoje a busca de cuidadoras, o mural de vagas, a agenda, as conversas e a carteira leem listas fixas escritas no código (Ana Paula Ribeiro, Família Duarte, R$ 3.840 de ganhos). Isso passa a vir do banco:

- **Buscar cuidadoras** (dentro do painel da família e nas páginas públicas) lista somente perfis reais de cuidadoras, com filtro por cidade, especialidade e selo. Sem perfis reais, aparece um aviso claro de "nenhuma cuidadora disponível ainda" em vez de nomes inventados.
- **Vagas / pedidos**: o pedido que a família publica é gravado e é exatamente isso que a cuidadora vê no mural, filtrado por cidade e especialidade. Candidatar-se grava a candidatura e abre a conversa.
- **Agenda** mostra apenas os plantões confirmados do próprio usuário.
- **Carteira e avaliações**: perfil novo começa com tudo zerado — R$ 0 de ganhos, 0 plantões, nenhuma avaliação, sem nota — e os valores passam a ser somados dos plantões realmente confirmados. Avaliações só aparecem quando uma família avalia de verdade.
- **Página inicial e /cuidadores** deixam de mostrar cuidadoras fictícias; exibem perfis reais verificados, ou um estado vazio honesto.

## 5. Revisão geral

- Bloqueio de acesso continua até a conferência manual; nada é aprovado ou reprovado automaticamente.
- Cada tela indica o que falta preencher para completar o cadastro.
- O dossiê do admin passa a mostrar todos os campos novos agrupados, com fotos e documentos (frente, verso, certidão).

## Detalhes técnicos

- Novas colunas em `public.profiles`: `telefone`, `foto_url`, `pix_tipo`, `pix_chave`, `experiencia_anos`, `cep`, `endereco_rua`, `endereco_numero`, `endereco_complemento`, `endereco_bairro`, `ponto_referencia`, `emergencia_nome`, `emergencia_telefone`, `paciente_idade`, `paciente_mobilidade`, `paciente_rotina`, `documento_frente_url`, `documento_verso_url`, `antecedentes_url`, `certificados` (jsonb).
- Tabelas novas: `vagas` (pedido da família: título, resumo, cidade, bairro, período, valor, unidade, status, `familia_id`), `candidaturas` (`vaga_id`, `cuidadora_id`, status) e `avaliacoes` (`cuidadora_id`, `familia_id`, `contrato_id`, nota, texto). Ganhos e nota são calculados a partir de `contratos`/`avaliacoes`, nunca armazenados como números fixos.
- O banco é o Supabase do próprio usuário, então entrego um script SQL (`supabase/cadastro-e-dados-reais.sql`) com `alter table ... add column if not exists`, `create table if not exists`, os `grant` e as políticas de RLS (leitura pública apenas de colunas seguras de cuidadoras verificadas; vagas visíveis para cuidadoras verificadas; avaliações legíveis publicamente). `src/integrations/supabase/types.ts` é atualizado junto.
- Leituras via `createServerFn` público (cliente publishable) para catálogo/busca e via `requireSupabaseAuth` para dados do próprio usuário. CEP por API pública, sem chave.
- `src/data/caregivers.ts`, `src/data/painel-cuidadora.ts` e `src/data/painel-familia.ts` deixam de exportar registros fictícios; permanecem apenas listas de opções (especialidades, turnos, tipos de cuidado).
- Telefone entra nos metadados do cadastro em `src/lib/acesso-cpf.functions.ts`, validado com Zod (10 ou 11 dígitos).
- Arquivos tocados: `AcessoCpf.tsx`, `PerfilFamilia.tsx`, `PerfilProfissional.tsx`, `BuscaCuidadoras.tsx`, `MuralOportunidades.tsx`, `PedidosFamilia.tsx`, `Agenda.tsx`, `CarteiraAvaliacoes.tsx`, `ResumoInicio.tsx`, `ResumoFamilia.tsx`, `DossieCadastro.tsx`, `EnvioDocumento.tsx`, `src/routes/index.tsx`, `src/routes/cuidadores.tsx`.
