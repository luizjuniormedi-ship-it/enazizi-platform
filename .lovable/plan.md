

# Plano: Notificacao clara de categoria concluida na Anamnese

## O que muda

Quando o aluno cobre uma nova categoria (ex: QP, HDA, Alergias), o sistema mostrara uma **notificacao visual inline no chat** confirmando a conclusao, alem de uma **animacao no checklist**.

## Implementacao em `src/pages/AnamnesisTrainer.tsx`

### 1. Toast/banner inline no chat ao concluir categoria
- No bloco onde `setCoveredCategories` e atualizado (linha ~376), detectar categorias **recem-adicionadas** (comparar prev com next)
- Para cada nova categoria, inserir uma **mensagem de sistema** no chat com visual distinto:
  - Fundo verde sutil, icone de CheckCircle, texto "QP concluida" (usando o label da categoria)
  - Estilo diferente das bolhas de paciente/medico (centralizado, badge-like)

### 2. Animacao no checklist
- Quando uma categoria muda de pendente para coberta, aplicar animacao `animate-bounce` ou `scale` momentanea no icone correspondente (tanto na barra mobile quanto na sidebar desktop)

### 3. Contador de progresso com feedback
- Ao atingir marcos (50%, 75%, 100% das categorias), mostrar mensagem especial no chat:
  - 50%: "Metade da anamnese coberta"
  - 75%: "Quase la! Faltam X categorias"
  - 100%: "Anamnese completa! Hora do diagnostico"

## Impacto

Apenas visual/UX. Nenhuma mudanca em edge function ou banco.

