

# Pipeline Completo de Ingestão, Indexação e Extração de Questões

## Estado Atual

| Item | Valor |
|---|---|
| Questões no banco | 8.931 |
| Com imagem | 4 |
| REVALIDA | 1.360 |
| ENARE | 0 (indexadas, não extraídas) |
| Exam banks | 14 |
| Coluna `review_status` | Existe (default: approved) |

Já existe: `AdminIngestionPanel` (ENARE PDFs), `AdminWebScrapingPanel` (busca por especialidade), edge function `extract-exam-questions` (parser REVALIDA), `search-real-questions` (scraping).

**Falta**: tabela de log de ingestão, colunas `source_type`/`permission_type` no `questions_bank`, painel admin de revisão de questões importadas, e unificação dos pipelines.

## Plano de Implementação

### 1. Migração SQL — Novas colunas e tabela de log

**Tabela `ingestion_log`** (nova):
- `id`, `source_name`, `source_url`, `source_type` (upload/pdf_public/indexed_external/licensed), `permission_type`, `banca`, `year`, `questions_found`, `questions_inserted`, `questions_updated`, `duplicates_skipped`, `errors`, `status`, `created_at`, `created_by`

**Colunas novas em `questions_bank`**:
- `source_type text DEFAULT 'unknown'` — (own_content, licensed, user_uploaded, indexed_external)
- `permission_type text DEFAULT 'unknown'`
- `source_url text`

RLS: admins CRUD no `ingestion_log`, service_role ALL.

### 2. Expandir `AdminIngestionPanel` → Painel Unificado

Transformar o componente atual em um painel com 4 abas:

- **Fontes Indexadas**: lista de provas indexadas (ENARE, REVALIDA, USP) com botão "Extrair" para cada PDF público
- **Upload Direto**: drag-and-drop de PDF/DOCX/TXT/CSV/JSON → dispara edge function correspondente
- **Navegação Web**: input de URL → fetch da página → identifica provas/links → exibe para extração seletiva
- **Revisão**: lista de questões com `review_status = 'pending'` → aprovar/rejeitar/editar individualmente

Cada aba com stats em tempo real (total fontes, extraídas, duplicatas, erros).

### 3. Edge Function `ingest-questions` (nova, unificada)

Recebe:
```json
{
  "mode": "upload" | "pdf_url" | "web_navigate" | "index_only",
  "url?": "https://...",
  "upload_id?": "uuid",
  "banca?": "ENARE",
  "year?": 2025,
  "source_type": "user_uploaded" | "indexed_external" | "licensed"
}
```

Fluxo:
1. **upload**: lê arquivo do storage → parseia com `parseExamQuestions` existente
2. **pdf_url**: fetch PDF → extrai texto → parseia
3. **web_navigate**: fetch URL → identifica links de provas → retorna lista (sem extrair)
4. **index_only**: salva referência no `ingestion_log` sem extrair conteúdo

Para todos os modos de extração:
- Validação: português, 4-5 alternativas, enunciado > 100 chars, sem referência a imagem
- Deduplicação: hash dos primeiros 200 chars normalizados vs banco existente
- Insert com `source_type`, `permission_type`, `source_url`
- Log no `ingestion_log`

### 4. Painel Admin de Revisão de Questões

Componente `AdminQuestionReviewPanel` com:
- Lista paginada de questões `review_status = 'pending'`
- Para cada questão: enunciado, alternativas, gabarito, fonte, permissão
- Botões: Aprovar / Rejeitar / Editar
- Filtros por banca, ano, fonte, status
- Bulk actions (aprovar todas de uma fonte)

### 5. Atualizar integração com módulos existentes

As questões com `review_status = 'approved'` já são usadas nos módulos (Simulados, Banco de Questões, Study Engine, Missão). Garantir que:
- `QuestionsBank.tsx` filtra por `review_status = 'approved'`
- `SimuladoSetup` usa apenas questões aprovadas
- Study Engine respeita o filtro

### Arquivos Impactados

| Arquivo | Ação |
|---|---|
| 1 migração SQL | Criar `ingestion_log` + colunas em `questions_bank` |
| `supabase/functions/ingest-questions/index.ts` | Nova edge function unificada |
| `src/components/admin/AdminIngestionPanel.tsx` | Expandir com 4 abas |
| `src/components/admin/AdminQuestionReviewPanel.tsx` | Novo componente de revisão |
| `src/pages/Admin.tsx` | Adicionar painel de revisão |
| `supabase/config.toml` | Registrar nova function |

### Resultado Esperado

- Pipeline unificado com 4 modos de entrada (upload, PDF, web, indexação)
- Rastreabilidade completa (source_type, permission_type, source_url)
- Painel de revisão para aprovar/rejeitar questões importadas
- Log de todas as operações de ingestão
- Zero duplicatas por deduplicação hash + similaridade

