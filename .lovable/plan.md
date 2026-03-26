

# Plano: Zerar temas antigos ao criar novo plano de estudo

## Problema
Ao gerar um novo plano de estudo no Cronograma, os temas antigos permanecem ativos. Isso mistura conteúdo de planos diferentes e polui o Plano do Dia com temas que já não fazem parte do plano atual.

## Solução
Antes de inserir os novos temas do plano, deletar todos os dados do plano anterior do usuário.

## Alteração

### Editar `src/pages/CronogramaInteligente.tsx`

No callback `onSubjectsGenerated` (linha ~518), **antes** de inserir novos temas:

1. Deletar todas as `revisoes` do usuário (dependem de `tema_id`)
2. Deletar todos os `desempenho_questoes` do usuário (dependem de `tema_id`)
3. Deletar todos os `temas_estudados` do usuário
4. Limpar o state local `temas` para evitar o filtro de "já existentes" bloquear inserções
5. Remover a linha 521-522 que filtra `newSubjects` por `existingNames` (já que tudo foi zerado)

```typescript
// Zerar dados antigos antes de criar novo plano
await supabase.from("desempenho_questoes").delete().eq("user_id", user.id);
await supabase.from("revisoes").delete().eq("user_id", user.id);
await supabase.from("temas_estudados").delete().eq("user_id", user.id);
```

## Resultado
- Cada novo plano de estudo começa do zero
- Sem mistura de temas antigos com novos
- Plano do Dia reflete apenas o plano atual

## Arquivos
- Editar: `src/pages/CronogramaInteligente.tsx`

