
# Sistema de Questões com Imagem Médica — Plano de Implementação

## Fase 1 — Banco de Dados (esta mensagem)
1. **Migration**: Criar 4 tabelas (`medical_image_assets`, `medical_image_questions`, `medical_image_question_audit`, `exam_question_usage`) com enums, índices, FKs e RLS
2. **Feature flag**: Adicionar `image_questions_enabled` ao sistema de flags
3. **Seed**: Inserir 220 assets curados (ECG, RX, TC, Dermato, Oftalmo, Patologia, US) com metadados clínicos estruturados + 220 questões publicadas

## Fase 2 — Validação e Pipeline (mesma mensagem)
4. **Validação clínica** (`src/lib/imageQuestionValidation.ts`): Checagem de idioma, alternativas, diagnóstico, coerência
5. **Pipeline de geração** (`src/lib/imageQuestionPipeline.ts`): Seleção de asset → carregamento de metadados → geração determinística → validação → publicação

## Fase 3 — Frontend e UI (mesma mensagem)
6. **Componente de questão com imagem** (`src/components/simulados/ImageQuestion.tsx`): Zoom, expand, skeleton, mobile-friendly
7. **Integração com simulados**: Permitir mix de questões textuais + imagem com percentual configurável
8. **Fallback seguro**: Se faltar asset, usar questão textual do mesmo tema

## Fase 4 — Integração e Testes
9. **Integração com SimuladoSetup**: Slider para % de questões com imagem
10. **Auditoria automática**: Trigger para registrar mudanças
11. **Validação final**: Testar ECG, RX, TC, Dermato, Oftalmo, Patologia, US

## O que NÃO muda
- Fluxo atual de simulados textuais (continua funcionando igual)
- Missão, plano diário, Study Engine
- Edge functions existentes
- Feature flag garante rollout seguro (desabilitado por padrão)

## Arquivos alterados/criados
- 1 migration SQL (tabelas + enums + índices + RLS)
- `src/lib/imageQuestionValidation.ts`
- `src/lib/imageQuestionPipeline.ts`
- `src/components/simulados/ImageQuestion.tsx`
- `src/components/simulados/SimuladoSetup.tsx` (adicionar config de imagem)
- `src/pages/Simulados.tsx` (integrar questões com imagem)
- `src/hooks/useFeatureFlags.ts` (adicionar flag)
- Seed de 220 assets + 220 questões

## Riscos mitigados
- Feature flag desabilitada por padrão = zero impacto em produção
- Fallback textual = simulado nunca quebra
- Validação clínica = nunca publica questão inválida
- Audit trail = rastreabilidade completa
