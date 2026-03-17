

## Plano: Reforçar variação de anamnese no prompt e rodar geração ENAMED

### Problema
O prompt atual já pede variação, mas não é enfático o suficiente sobre **nunca repetir a anamnese** entre questões do mesmo tema. O usuário quer que cada questão tenha um paciente completamente diferente (nome, idade, sexo, profissão, comorbidades, cenário).

### Alteração

**Arquivo**: `supabase/functions/enamed-generator/index.ts`

Adicionar no prompt, na seção "VARIAÇÃO OBRIGATÓRIA", regras explícitas anti-repetição de anamnese:

```
5. **ANAMNESE ÚNICA POR QUESTÃO (REGRA ABSOLUTA)**:
   - NUNCA repita nome, idade, sexo ou perfil de paciente entre questões
   - Cada questão DEVE ter um paciente COMPLETAMENTE DIFERENTE
   - Variar: nomes regionais brasileiros, idades de 0 a 95 anos, profissões diversas
   - Alternar cenários: PS, enfermaria, UTI, UBS, SAMU, ambulatório, domicílio
   - Variar comorbidades de base: DM, HAS, IRC, HIV, tabagismo, etilismo, gestante
   - Variar queixa principal e tempo de evolução (horas, dias, semanas, meses)
   - Incluir pacientes: idosos frágeis, gestantes, crianças, imunossuprimidos, trabalhadores rurais
   - PROIBIDO: dois pacientes com mesmo perfil demográfico no mesmo bloco
```

Também aumentar `temperature` de `0.7` para `0.85` para maior criatividade na variação dos pacientes.

### Execução após deploy

Invocar a função para cada especialidade individualmente para popular o banco com conteúdo variado.

### Resumo

| Arquivo | Ação |
|---|---|
| `supabase/functions/enamed-generator/index.ts` | Reforçar regra de anamnese única + aumentar temperature |

