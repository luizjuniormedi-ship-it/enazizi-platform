

# Normalização de Tópicos + Coluna Subtopic no Banco de Questões

## Problema

O `questions_bank` tem ~100+ variantes de tópicos fragmentados. Exemplos:
- `cirurgia` (53) vs `Cirurgia` (135) vs `Cirurgia Geral` (118) vs `Cirurgia do Trauma` (10)
- `Ginecologia` (167) separado de `Ginecologia e Obstetrícia` (429)
- `pediatria` (20) vs `Pediatria` (191)
- `pneumologia` (18) vs `Pneumologia` (81)
- `dermatologia` (7) vs `Dermatologia` (64)
- `Emergência` (111) vs `Medicina de Emergência` (35)
- Subtópicos como tópicos: `Abdome Agudo` (28), `Apendicite` (9), `Cetoacidose Diabética` (12), `IAM e SCA` (16)
- Compostos: `Cardiologia / Farmacologia` (17), `Nefrologia / Cardiologia` (9), `Clínica Médica - Cardiologia` (52)

Não existe coluna `subtopic` — tudo está misturado no campo `topic`.

## Mudanças

### 1. Migração SQL — Adicionar coluna `subtopic` e normalizar dados

```sql
-- Adicionar coluna subtopic
ALTER TABLE questions_bank ADD COLUMN subtopic text;

-- Normalização de case
UPDATE questions_bank SET topic = 'Cirurgia' WHERE topic = 'cirurgia';
UPDATE questions_bank SET topic = 'Pediatria' WHERE topic = 'pediatria';
UPDATE questions_bank SET topic = 'Pneumologia' WHERE topic = 'pneumologia';
UPDATE questions_bank SET topic = 'Dermatologia' WHERE topic = 'dermatologia';
UPDATE questions_bank SET topic = 'Hipertensão Arterial'... → 'Cardiologia'
-- (e demais variantes)

-- Consolidação de sinônimos
UPDATE questions_bank SET topic = 'Ginecologia e Obstetrícia' WHERE topic IN ('Ginecologia', 'Ginecologia - Endocrinologia');
UPDATE questions_bank SET topic = 'Cirurgia' WHERE topic IN ('Cirurgia Geral', 'Cirurgia do Trauma');
UPDATE questions_bank SET topic = 'Medicina de Emergência' WHERE topic IN ('Emergência');
UPDATE questions_bank SET topic = 'Medicina Preventiva' WHERE topic IN ('Medicina Preventiva e Saúde Coletiva');

-- Subtópicos extraídos de tópicos compostos (ex: "Cardiologia - Arritmias" → topic=Cardiologia, subtopic=Arritmias)
UPDATE questions_bank SET subtopic = 'Arritmias', topic = 'Cardiologia' WHERE topic = 'Cardiologia - Arritmias';
UPDATE questions_bank SET subtopic = 'Insuficiência Cardíaca', topic = 'Cardiologia' WHERE topic IN ('Cardiologia - Insuficiência Cardíaca', 'Insuficiência Cardíaca');
UPDATE questions_bank SET subtopic = 'Hipertensão Arterial', topic = 'Cardiologia' WHERE topic IN ('Cardiologia - Hipertensão Arterial', 'hipertensão arterial');
UPDATE questions_bank SET subtopic = 'IAM', topic = 'Cardiologia' WHERE topic IN ('Cardiologia - IAM', 'IAM e SCA');
UPDATE questions_bank SET subtopic = 'PCR', topic = 'Cardiologia' WHERE topic LIKE 'Cardiologia - Parada%';
-- ... ~40 regras similares para todos os subtópicos identificados

-- Subtópicos que eram tópicos independentes
UPDATE questions_bank SET subtopic = 'Abdome Agudo', topic = 'Cirurgia' WHERE topic = 'Abdome Agudo';
UPDATE questions_bank SET subtopic = 'Apendicite', topic = 'Cirurgia' WHERE topic IN ('Apendicite', 'Apendicite Aguda');
UPDATE questions_bank SET subtopic = 'Cetoacidose Diabética', topic = 'Endocrinologia' WHERE topic = 'Cetoacidose Diabética';
UPDATE questions_bank SET subtopic = 'Neonatologia', topic = 'Pediatria' WHERE topic = 'Neonatologia';
-- ... demais subtópicos

-- Tópicos compostos com "/" → primeiro especialidade como topic, segundo como subtopic
UPDATE questions_bank SET subtopic = 'Farmacologia', topic = 'Cardiologia' WHERE topic = 'Cardiologia / Farmacologia';
UPDATE questions_bank SET subtopic = 'Cardiologia', topic = 'Nefrologia' WHERE topic = 'Nefrologia / Cardiologia';

-- "Clínica Médica" → redistribuir usando subtopic
UPDATE questions_bank SET subtopic = 'Cardiologia', topic = 'Clínica Médica' WHERE topic = 'Clínica Médica - Cardiologia';

-- "ENARE" e "Geral" → manter como topic (são provas genéricas multi-especialidade)
```

A migração completa terá ~60 UPDATEs cobrindo todas as variantes encontradas na query acima.

### 2. `src/integrations/supabase/types.ts` — Auto-atualizado

Após a migração, o campo `subtopic` aparecerá automaticamente no tipo gerado.

### 3. Código que referencia `topic` — Verificar compatibilidade

Arquivos que fazem queries em `questions_bank.topic`:
- `src/components/admin/AdminQuestionReviewPanel.tsx` — filtros por tópico
- `src/components/admin/AdminIngestionPanel.tsx` — contagens
- `src/pages/QuestionsBank.tsx` — listagem
- `supabase/functions/professor_bi` — análise de desempenho por tópico
- `supabase/functions/study-session` — seleção de questões
- `supabase/functions/daily-question-generator` — geração

Nenhum desses precisa de mudança funcional — os tópicos normalizados são compatíveis com os nomes já esperados em `mapTopicToSpecialty.ts` e `SPECIALTY_SUBTOPICS`. Apenas atualizar filtros de UI que mostram dropdown de tópicos para incluir `subtopic` como filtro secundário opcional.

### 4. `src/pages/QuestionsBank.tsx` — Filtro de subtópico

Adicionar dropdown secundário "Subtema" que aparece quando um tópico é selecionado, filtrando por `subtopic`.

### 5. `src/components/admin/AdminQuestionReviewPanel.tsx` — Mostrar subtópico

Exibir coluna `subtopic` na tabela de revisão de questões quando disponível.

## Mapeamento completo de normalização

```text
VARIANTE ATUAL                              → TOPIC NORMALIZADO        | SUBTOPIC
─────────────────────────────────────────────┼─────────────────────────┼──────────────────
cirurgia                                     → Cirurgia                |
Cirurgia Geral                               → Cirurgia                |
Cirurgia do Trauma                           → Cirurgia                | Trauma
Abdome Agudo                                 → Cirurgia                | Abdome Agudo
Apendicite / Apendicite Aguda                → Cirurgia                | Apendicite
Hérnia Inguinal                              → Cirurgia                | Hérnia Inguinal
Colecistite e Colelitíase / Colecistite Aguda→ Cirurgia                | Colecistite
Obstrução Intestinal                         → Cirurgia                | Obstrução Intestinal
Diverticulite                                → Cirurgia                | Diverticulite
Pancreatite Aguda                            → Gastroenterologia       | Pancreatite Aguda
Trauma Abdominal / Trauma Torácico           → Cirurgia                | Trauma
Queimaduras                                  → Cirurgia                | Queimaduras
Politrauma e ATLS                            → Medicina de Emergência  | Politrauma
Ginecologia                                  → Ginecologia e Obstetrícia|
Ginecologia - Endocrinologia                 → Ginecologia e Obstetrícia| Endocrinologia Ginecológica
pediatria                                    → Pediatria               |
Pediatria Geral / Pediatria - Desenvolvimento→ Pediatria               | Desenvolvimento
Neonatologia                                 → Pediatria               | Neonatologia
Infecções Respiratórias Pediátricas          → Pediatria               | Infecções Respiratórias
Doenças Exantemáticas                        → Pediatria               | Doenças Exantemáticas
Doenças Infecciosas Pediátricas              → Pediatria               | Infecções
pneumologia                                  → Pneumologia             |
Pneumonia Comunitária                        → Pneumologia             | Pneumonia
Tuberculose Pulmonar                         → Pneumologia             | Tuberculose
dermatologia                                 → Dermatologia            |
Emergência                                   → Medicina de Emergência  |
Choque Hipovolêmico                          → Medicina de Emergência  | Choque
Cardiologia - * (todas variantes)            → Cardiologia             | (extraído)
Cardiologia / Farmacologia                   → Cardiologia             | Farmacologia
hipertensão arterial                         → Cardiologia             | Hipertensão Arterial
Insuficiência Cardíaca                       → Cardiologia             | Insuficiência Cardíaca
IAM e SCA                                    → Cardiologia             | IAM
Cetoacidose Diabética                        → Endocrinologia          | Cetoacidose Diabética
Nódulo Tireoidiano                           → Endocrinologia          | Nódulo Tireoidiano
Insuficiência Renal Aguda                    → Nefrologia              | IRA
Doença Renal Crônica                         → Nefrologia              | DRC
Distúrbios Hidroeletrolíticos                → Nefrologia              | Distúrbios Hidroeletrolíticos
HIV/AIDS                                     → Infectologia            | HIV/AIDS
Anemia Falciforme                            → Hematologia             | Anemia Falciforme
LES                                          → Reumatologia            | LES
Medicina Preventiva e Saúde Coletiva         → Medicina Preventiva     |
Princípios do SUS                            → Medicina Preventiva     | SUS
Doenças de Notificação Compulsória           → Medicina Preventiva     | Notificação Compulsória
Oncologia - Câncer de *                      → Oncologia               | (extraído)
Câncer Gástrico / Câncer Colorretal / etc    → Oncologia               | (nome)
Angiologia e Cirurgia Vascular               → Angiologia              |
Semiologia Cardiovascular                    → Semiologia              | Cardiovascular
Exame Neurológico / Exame Físico Geral       → Semiologia              | (nome)
Hepatologia                                  → Gastroenterologia       | Hepatologia
Torção Testicular / Hiperplasia Prostática   → Urologia                | (nome)
Clínica Médica                               → Clínica Médica          | (manter)
ENARE / Geral                                → (manter)                |
```

## Resultado

- ~30 tópicos normalizados (em vez de ~100+)
- Subtópicos preservados como metadado granular
- Filtro hierárquico no banco de questões (Tópico → Subtema)
- Compatível com `mapTopicToSpecialty.ts` e `SPECIALTY_SUBTOPICS`

