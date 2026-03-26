

# Plano: Busca Geral em Todas as Especialidades

## Objetivo
Adicionar um botao "Buscar Todas" no painel admin que dispara buscas sequenciais em todas as 21 especialidades, com progresso visual em tempo real.

## Alteracoes

### 1. Frontend — `AdminWebScrapingPanel.tsx`
- Adicionar botao "Buscar Todas as Especialidades"
- Mostrar barra de progresso: "Buscando 3/21: Dermatologia..."
- Ao final, exibir resumo: total de questoes encontradas por especialidade
- Executar sequencialmente (uma por vez) para evitar timeout e rate-limit do Firecrawl
- Permitir cancelar a busca em andamento

### 2. Edge Function — `search-real-questions/index.ts`
- Adicionar modo `bulk: true` que aceita array de especialidades
- Processar uma especialidade por vez internamente, retornando resultados parciais
- **Alternativa mais segura**: manter a funcao como esta (uma especialidade por chamada) e fazer o loop no frontend — evita timeout da edge function

### Abordagem escolhida
Loop no frontend (mais robusto):
```text
Para cada especialidade em SPECIALTIES[]:
  1. Chamar search-real-questions com { specialty, auto: false }
  2. Atualizar progresso visual
  3. Aguardar 2s entre chamadas (rate-limit)
  4. Acumular resultados
Exibir resumo final
```

### Resultado
- Um clique busca questoes reais em todas as 21 especialidades
- Progresso visivel com contagem de questoes encontradas
- Flashcards gerados automaticamente para cada questao encontrada

## Arquivos a modificar
- `src/components/admin/AdminWebScrapingPanel.tsx`

