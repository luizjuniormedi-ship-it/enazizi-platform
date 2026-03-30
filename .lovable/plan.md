

# Adicionar Exame Físico e Manobras Diagnósticas ao Prompt do Tutor

## O que muda

Inserir uma nova seção obrigatória **5½** no prompt base entre "Manifestações clínicas" e "Conduta clínica".

## Arquivo editado

### `supabase/functions/_shared/enazizi-prompt.ts`

1. **Nova seção após item 5️⃣ (Manifestações clínicas), antes do item 6️⃣ (Conduta)**:

```text
5½ 🩺 Exame Físico e Manobras Diagnósticas

📋 Inspeção:
• achado visual → significado clínico

🖐️ Palpação:
• achado palpável → significado clínico

🔨 Manobras específicas (formato tabela):
| Manobra | Como fazer | Achado positivo | O que indica |

🔊 Ausculta (quando aplicável):
• achado auscultatório → significado

REGRAS:
- Sempre citar o NOME da manobra
- Descrever COMO realizar
- Explicar achado POSITIVO vs NEGATIVO
- Correlacionar achado → diagnóstico provável
- Incluir sensibilidade/especificidade quando conhecidas
- Mínimo 2 manobras por tema (quando aplicável)
```

2. **Renumerar** itens 6-9 para 7-10

3. **Adicionar à checklist pré-resposta** (linha ~36): item 🔟 "Os achados de exame físico e manobras diagnósticas foram incluídos"

4. **Mensagem 2** (linha ~94): adicionar menção ao exame físico na descrição

## Impacto

- 1 arquivo editado
- Zero mudança em rotas, edge functions ou lógica
- O Tutor passará a ensinar manobras com nome técnico, técnica de execução e interpretação dos achados

