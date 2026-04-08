

# Plano: Busca de Imagens Médicas Reais para o Pipeline Multimodal

## Problema
Todas as imagens do banco multimodal atualmente são geradas por IA (Gemini), resultando em imagens com aparencia de animacao/ilustracao. Para dermatologia, TC, patologia e outras modalidades visuais, imagens reais clinicas sao essenciais para realismo e valor pedagogico.

## Solucao

### 1. Nova Edge Function: `search-real-medical-images`
Criar uma edge function que usa **Firecrawl** (ja conectado) para buscar imagens medicas reais em fontes abertas e confiáveis:

- **Fontes priorizadas**: DermNet NZ, Radiopaedia, OpenI NIH, Wikimedia Commons Medical, atlases universitarios abertos
- **Fluxo**: Recebe `image_type` + `diagnosis` → busca via Firecrawl scrape com formato screenshot/html → extrai URLs de imagens clinicas → filtra por qualidade (tamanho minimo, formato) → faz download e upload no storage `question-images` → atualiza o asset com `asset_origin = 'real_clinical'`
- **Seguranca**: Apenas fontes CC/open-access, registra `source_url` e `license_type` no asset

### 2. Migração de banco: campos de rastreabilidade
Adicionar colunas na tabela `medical_image_assets`:
- `source_url TEXT` — URL original da imagem
- `license_type TEXT DEFAULT 'ai_generated'` — tipo de licenca (`cc_by`, `cc_by_sa`, `public_domain`, `educational_fair_use`, `ai_generated`)
- `source_domain TEXT` — dominio de origem para auditoria

### 3. Botao no painel admin: "Buscar Imagem Real"
No `ImageQuestionUpgradePanel` ou `AdminImageQuestionReviewPanel`:
- Botao por asset ou em lote por modalidade
- Ao clicar, chama a edge function com o diagnóstico do asset
- Mostra preview da imagem encontrada para aprovacao manual antes de substituir
- Prioridade: **dermatologia > patologia > oftalmologia > RX > TC**

### 4. Modo hibrido no `generate-medical-images`
Atualizar a edge function existente para:
- **Primeiro**: tentar buscar imagem real via Firecrawl
- **Fallback**: se nao encontrar imagem real adequada, gerar via IA
- Registrar `asset_origin` como `real_clinical` ou `ai_generated_v2`

### 5. Painel de curadoria visual
No review panel, exibir badge indicando a origem da imagem:
- 🟢 "Imagem Real" (real_clinical)
- 🟡 "Gerada por IA" (ai_generated)
- Filtro por origem para facilitar auditoria

## Fontes medicas abertas a serem buscadas

```text
Dermatologia:  dermnet.com, dermnetnz.org, atlasdermatologico.com.br
Radiologia:    radiopaedia.org, openi.nlm.nih.gov
Patologia:     pathologyoutlines.com, webpathology.com
Oftalmologia:  eyewiki.aao.org
Geral:         commons.wikimedia.org (categoria Medical)
```

## Fluxo tecnico

```text
Admin clica "Buscar Imagem Real"
       ↓
Edge Function recebe {asset_id, diagnosis, image_type}
       ↓
Firecrawl scrape em fonte especifica por modalidade
       ↓
Extrai URLs de imagem da pagina (filtra por tamanho > 200px)
       ↓
Download da melhor imagem → upload no storage
       ↓
Atualiza asset: image_url, asset_origin='real_clinical', source_url, license_type
       ↓
Asset fica com review_status='needs_review' para aprovacao visual
```

## Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/search-real-medical-images/index.ts` | Nova edge function |
| `supabase/migrations/xxx_add_image_source_fields.sql` | Novos campos no banco |
| `src/components/admin/AdminImageQuestionReviewPanel.tsx` | Botao "Buscar Real" + badge origem |
| `src/components/admin/ImageQuestionUpgradePanel.tsx` | Botao lote "Buscar Reais" por modalidade |
| `supabase/functions/generate-medical-images/index.ts` | Modo hibrido (real-first, AI-fallback) |

## Seguranca e compliance
- Apenas fontes com licenca aberta (CC, public domain, educational)
- Imagem real sempre passa por revisao manual antes de publicacao
- `source_url` registrada para auditoria
- Nenhuma imagem de paciente identificavel (filtro por contexto da fonte)

