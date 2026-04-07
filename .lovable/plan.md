
# Correção definitiva das quantidades no gerador do Professor

## Diagnóstico
- O fluxo com problema não usa `question-generator`; ele usa `supabase/functions/professor-simulado`. Por isso a correção anterior não cobriu esse caso.
- Hoje o backend do Professor tenta gerar lotes grandes (`25` no frontend / até `30` no backend) com questões clínicas longas. Como o stack tem limite prático de saída por chamada, parte da resposta vem truncada e depois é descartada nos filtros. Resultado: o usuário pede 50 e recebe 38.
- A tela aceita geração parcial como se estivesse pronta: o botão “Criar e Atribuir” continua disponível mesmo com déficit.
- No “Regenerar faltantes”, as novas questões entram por estado assíncrono e a criação do simulado não está protegida contra clique com lista ainda antiga. Isso explica o “regenerou, mas não computou no simulado”.

## Arquivos a alterar
1. `supabase/functions/professor-simulado/index.ts`
2. `src/pages/ProfessorDashboard.tsx`

## Plano de implementação
### 1) Tornar a quantidade um contrato real no backend
Em `professor-simulado` eu vou:
- reduzir o tamanho seguro dos lotes de IA para algo compatível com questões longas;
- parar de depender de uma única chamada grande para fechar a quantidade;
- adicionar loop interno de complementação até atingir o total pedido ou esgotar tentativas;
- deduplicar e truncar no final para devolver exatamente o número solicitado quando houver material suficiente;
- retornar metadados explícitos:
  - `requested_count`
  - `generated_count`
  - `missing_count`
  - `exact_count`
  - `source`

### 2) Bloquear criação parcial no Painel do Professor
Em `ProfessorDashboard` eu vou:
- tratar a quantidade pedida como referência canônica da geração atual;
- recalcular o déficit sempre a partir da lista consolidada de questões;
- bloquear “Criar e Atribuir” enquanto:
  - a geração/regeneração estiver em andamento;
  - a quantidade final for menor que a pedida;
- ajustar o feedback visual para contagem real: “38/50”, “faltam 12”, “50/50 pronto”.

### 3) Corrigir o “regenerou mas não computou”
Ainda em `ProfessorDashboard` eu vou:
- manter uma referência autoritativa da lista consolidada de questões da sessão atual;
- usar essa referência no momento de criar o simulado, em vez de depender só do estado visual;
- desabilitar criação durante o regenerate para eliminar race condition de clique rápido;
- garantir que `total_questions` e `questions_json.length` saiam sempre sincronizados.

### 4) Revisar mudanças de quantidade durante a montagem
Também vou ajustar os cenários em que a configuração muda no meio do fluxo:
- se o professor alterar `questionCount`, tópicos, dificuldade ou distribuição depois de gerar, o lote atual deixa de ser válido para criação até nova geração;
- no modo com distribuição por tema, o total final continuará sendo auditado pelo total global pedido.

## Evidência que vou validar depois da implementação
1. Pedir 50 questões no fluxo do Professor:
   - preview termina em `50/50`;
   - botão de criar só libera em `50/50`.
2. Forçar déficit e clicar em “Regenerar faltantes”:
   - a contagem visual sobe corretamente;
   - o simulado salvo nasce com a mesma contagem vista na tela.
3. Conferir persistência:
   - `teacher_simulados.total_questions`
   - tamanho real de `teacher_simulados.questions_json`
   - `teacher_simulado_results.total_questions`
   Todos devem bater.
4. Testar clique rápido:
   - durante regeneração, não pode ser possível salvar com lista antiga.

## Detalhes técnicos
- A causa principal aqui é arquitetura de lote: o fluxo do Professor ainda gera questões longas demais por chamada para o limite efetivo do stack atual.
- A correção confiável não é “só aumentar tokens”; é combinar:
  - lotes menores,
  - complementação controlada,
  - contrato explícito de contagem,
  - bloqueio de criação parcial no frontend.
- Não haverá mudança de rota, Study Engine, Tutor IA, RLS ou schema do banco.
