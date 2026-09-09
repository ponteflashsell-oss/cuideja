# Cadastro completo: dados comuns, dossiê da família e dossiê da cuidadora

Hoje o cadastro guarda pouca coisa: CPF, nome, data de nascimento, cidade, bairros, descrição, especialidades e tarifas. Faltam telefone, endereço do plantão, contato de emergência, perfil do paciente, foto de perfil, chave Pix e experiência. O plano completa esses três blocos.

## 1. Identificação básica (todos)

Já existe: CPF, nome completo, data de nascimento.
A acrescentar:

- Telefone/WhatsApp obrigatório, com máscara, pedido na criação da conta (passo 2) e editável no perfil.
- Aviso curto explicando que o número é usado para alertas, confirmações e emergências.

## 2. Dossiê do cliente / família

Nova seção "Endereço do atendimento" no perfil da família:

- CEP (com busca automática de rua/bairro/cidade), rua, número, complemento, bairro, cidade, ponto de referência.
- Contato de emergência secundário: nome e telefone.

Nova seção "Perfil do paciente e rotina":

- Idade do paciente.
- Grau de mobilidade: acamado, cadeirante, mobilidade reduzida, autônomo.
- Condições de saúde (as marcações que já existem, mantidas).
- Campo de rotina de medicação e cuidados.

A foto de conferência (rosto com documento) já existe e continua como está.

## 3. Dossiê da cuidadora

- Foto de perfil real: hoje o botão da câmera só mostra um aviso. Passa a enviar a imagem, guardar e exibir no catálogo de busca.
- Chave Pix (tipo: CPF, telefone, e-mail ou aleatória + a chave) para repasse dos plantões.
- Documentação: RG/CNH frente e verso (hoje é um único envio) e certidão de antecedentes criminais.
- Qualificações: especialidades (já existem), cursos/certificações com envio de arquivo e tempo de experiência em anos.

## 4. Painel do administrador

O dossiê aberto pelo admin passa a mostrar todos os campos novos, agrupados por bloco, com fotos e documentos visíveis, incluindo frente/verso e certidão.

## 5. Revisão geral

- Bloqueio de acesso continua até a conferência manual; nada é aprovado ou reprovado automaticamente.
- Cada tela mostra o que ainda falta preencher para completar o cadastro.

## Detalhes técnicos

- Novas colunas em `public.profiles`: `telefone`, `foto_url`, `pix_tipo`, `pix_chave`, `experiencia_anos`, `cep`, `endereco_rua`, `endereco_numero`, `endereco_complemento`, `endereco_bairro`, `ponto_referencia`, `emergencia_nome`, `emergencia_telefone`, `paciente_idade`, `paciente_mobilidade`, `paciente_rotina`, `documento_frente_url`, `documento_verso_url`, `antecedentes_url`, `certificados` (jsonb).
- O banco é o Supabase próprio do usuário, então entrego um script SQL (`supabase/cadastro-completo.sql`) com `alter table ... add column if not exists` e os `grant` necessários, para rodar no SQL Editor. Os tipos gerados em `src/integrations/supabase/types.ts` são atualizados junto.
- CEP consultado por API pública de CEP, sem chave.
- Uploads seguem o padrão atual: envio direto ao bucket `verificacoes` (documentos privados) e um bucket público para a foto de perfil da cuidadora.
- Telefone entra também nos metadados do cadastro em `src/lib/acesso-cpf.functions.ts` e é validado com Zod (10 ou 11 dígitos).
- Arquivos tocados: `AcessoCpf.tsx`, `PerfilFamilia.tsx`, `PerfilProfissional.tsx`, `DossieCadastro.tsx`, `EnvioDocumento.tsx`, `src/data/painel-familia.ts`, `src/data/painel-cuidadora.ts`.
