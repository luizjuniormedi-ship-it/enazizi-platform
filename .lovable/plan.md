

# BI Professor — Clareza Visual + Cruzamentos Acadêmicos Avançados

## Problema

As abas "BI Proficiência" e "BI Plataforma Geral" não têm descrição clara, e os dados são apresentados de forma básica, sem cruzamentos analíticos que permitam tomada de decisão pedagógica informada.

## Mudanças

### 1. `src/components/professor/ProfessorBIPanel.tsx` — Clareza e Cruzamentos

**Banners explicativos** no topo de cada aba:
- **Proficiência**: "Resultados das atividades que você criou e atribuiu (simulados, casos clínicos, temas de estudo)"
- **Plataforma Geral**: "Jornada completa do aluno na plataforma: banco de questões, flashcards, simulados gerais, streaks"

**Renomear abas**:
- `🎯 BI Proficiência` → `🎯 Atividades do Professor`  
- `📊 BI Plataforma Geral` → `📊 Jornada Global`

**Novos cruzamentos na aba Proficiência**:
- **Matriz Desempenho × Conclusão por Aluno**: Heatmap/tabela mostrando cada aluno vs cada atividade (cores: verde=bom, amarelo=médio, vermelho=ruim, cinza=pendente) — visão completa de quem fez o quê e como foi
- **Ranking de Alunos por Desempenho em Proficiência**: Tabela ordenável com média de acerto, taxa de conclusão e tendência (↑↓→)
- **Cruzamento Tema × Aluno**: Quais alunos erraram mais em quais temas específicos (tabela pivotada)

**Novos cruzamentos na aba Jornada Global**:
- **Correlação Proficiência × Plataforma**: Card comparativo mostrando se alunos com bom desempenho nas atividades do professor também têm boa acurácia geral (e vice-versa) — identifica discrepâncias
- **Distribuição de Tempo de Estudo por Especialidade**: Onde os alunos mais investem tempo vs onde mais erram
- **Heatmap de Atividade Semanal**: Dias da semana × hora que mais estudam (dados de practice_attempts)

**Cores diferenciadas**: Cards de proficiência com borda azul/primary, cards de plataforma com borda roxa/violet

### 2. `supabase/functions/professor-simulado/index.ts` — Dados adicionais

Enriquecer o retorno do `professor_bi`:
- **`student_matrix`**: Array com `{ student_id, display_name, activities: [{ id, type, title, score, status }] }` para montar a matriz
- **`student_ranking`**: Array ordenado por média de acerto com campos de tendência
- **`topic_student_cross`**: Array com `{ topic, students: [{ name, correct, total, accuracy }] }` para cruzamento tema×aluno  
- **`proficiency_vs_platform`**: Array com `{ student_id, name, prof_accuracy, platform_accuracy, gap }` mostrando discrepância
- **`activity_heatmap`**: Contagem de practice_attempts agrupada por dia da semana × hora

### 3. Resultado

BI com nível acadêmico de tomada de decisão: o professor identifica em um olhar quais alunos precisam de intervenção, quais temas abordar, e se o desempenho nas atividades atribuídas reflete a jornada geral do aluno na plataforma. Todos os cruzamentos são visuais e intuitivos com gráficos, heatmaps e tabelas pivotadas.

