

# Adicionar Especialidades Faltantes ao Cronograma

## Problema
A lista `SPECIALTIES` do Cronograma tem 22 especialidades, mas faltam 3 que já existem no sistema (`mapTopicToSpecialty`) e são cobradas em provas ENAMED/Revalida:
- **Medicina de Emergência**
- **Terapia Intensiva**
- **Oncologia**

Quando um tema dessas áreas é importado via edital, ele cai no fallback "Medicina Preventiva", quebrando a categorização e os analytics.

## Alteração

### `src/pages/CronogramaInteligente.tsx` — Expandir `SPECIALTIES`
Adicionar as 3 especialidades faltantes à constante `SPECIALTIES` (linhas 100-107):

```typescript
export const SPECIALTIES = [
  "Cardiologia", "Pneumologia", "Neurologia", "Endocrinologia",
  "Gastroenterologia", "Nefrologia", "Infectologia", "Pediatria",
  "Ginecologia e Obstetrícia", "Cirurgia", "Medicina Preventiva",
  "Hematologia", "Reumatologia", "Dermatologia", "Urologia",
  "Ortopedia", "Otorrinolaringologia", "Oftalmologia", "Psiquiatria",
  "Semiologia", "Anatomia", "Farmacologia",
  "Medicina de Emergência", "Terapia Intensiva", "Oncologia",
];
```

Isso garante que:
- O dropdown de "Nova Tema" mostra essas opções
- Temas importados de editais são categorizados corretamente
- Os gráficos de performance por especialidade incluem essas áreas

### Arquivos modificados
- `src/pages/CronogramaInteligente.tsx` — 1 linha adicionada na constante

