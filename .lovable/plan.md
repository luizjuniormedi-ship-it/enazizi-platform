

# Tornar Manobras de Exame Físico Visíveis no Plantão

## Problema

O prompt do Plantão **descreve** que deve incluir `maneuvers_performed` nas respostas de exame físico (linha 99-101), mas o **template JSON de resposta** (linhas 131-152) não lista esse campo. A IA segue o template e omite as manobras estruturadas. O frontend já tem o código para renderizar os cards -- só não recebe os dados.

## Solução

### `supabase/functions/clinical-simulation/index.ts`

Adicionar `maneuvers_performed` ao template JSON de resposta (após `teaching_tip`, linha ~151):

```json
"maneuvers_performed": [{"name":"...","technique":"...","finding":"...","interpretation":"..."}],
```

E adicionar uma nota explícita: **"OBRIGATÓRIO quando response_type = 'physical_exam': inclua maneuvers_performed com no mínimo 2 manobras."**

## Impacto

- 1 arquivo editado (edge function)
- Zero mudança no frontend (já renderiza os cards)
- As manobras passarão a aparecer automaticamente nas respostas de exame físico

