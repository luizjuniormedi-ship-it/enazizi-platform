

# Revisão e Limpeza do Banco de Questões

## Diagnóstico

| Métrica | Quantidade |
|---|---|
| Total de questões | 9.695 |
| Enunciado < 150 chars **E** sem padrão de idade/tempo | **2.483** (a excluir) |
| Questões que ficam | **7.212** |

Exemplos de questões sem contexto: `"Teste"` (5 chars), `"A CONDUTA É:"` (12 chars) — claramente fragmentos de parsing mal feito, sem caso clínico.

## Critério de Exclusão

Excluir questões que atendam **ambas** as condições:
1. `length(statement) < 150` caracteres
2. Não contém padrão de idade/tempo (`\d+\s*(anos|meses|dias|horas|semanas)`)

Isso preserva questões curtas mas com contexto clínico (ex: "Paciente de 45 anos...") e remove lixo de parsing.

## Execução

### 1. Script de limpeza via `psql`

- Executar `DELETE FROM questions_bank WHERE length(statement) < 150 AND statement !~ '\d+\s*(anos?|meses|dias|horas|semanas)'`
- Registrar contagem de deletados

### 2. Relatório final

- Total antes / depois
- Breakdown por source das questões removidas

### Arquivos Impactados

Nenhum arquivo de código precisa ser alterado — é uma operação de dados apenas.

