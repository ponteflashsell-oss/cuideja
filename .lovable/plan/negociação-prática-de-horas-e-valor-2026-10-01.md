# Negociação prática de horas e valor

## Objetivo
Transformar a aba “Propostas” em uma negociação objetiva, semelhante ao fluxo da 99: cada lado visualiza a oferta atual e pode aceitar, recusar ou enviar uma nova combinação de quantidade de horas e valor.

## Alterações
- Exibir com destaque a quantidade de horas, o valor total e o valor aproximado por hora.
- Simplificar a contraproposta para dois campos principais: horas e valor total.
- Calcular automaticamente o horário final a partir do horário inicial e da quantidade de horas.
- Sincronizar o formulário com a proposta selecionada, evitando valores genéricos.
- Aplicar a mesma experiência nos painéis da família e da cuidadora.
- Manter o registro real já existente em propostas, sem chat livre e sem dados fictícios.
- Validar horas e valor antes do envio e mostrar mensagens claras de sucesso ou erro.

## Detalhes técnicos
- Reaproveitar `propostas` e as funções autenticadas já existentes.
- Derivar a duração a partir de `hora_inicio` e `hora_fim`, incluindo plantões que terminam no dia seguinte.
- Nas contrapropostas, persistir `valor_proposto`, `hora_inicio` e o novo `hora_fim` calculado.
