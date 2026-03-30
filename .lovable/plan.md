

# Adicionar Seção de Exame Físico e Manobras Diagnósticas ao Tutor

## Problema

O prompt do Tutor ensina fisiopatologia, conduta e diagnósticos diferenciais, mas **não tem uma seção dedicada ao exame físico**. O aluno não aprende quais achados procurar, quais manobras realizar e como interpretar os sinais.

## Solução

Adicionar uma nova seção obrigatória **"🩺 EXAME FÍSICO E MANOBRAS DIAGNÓSTICAS"** na estrutura de ensino do prompt base (`enazizi-prompt.ts`), entre "Manifestações clínicas" (item 5) e "Conduta clínica" (item 6).

## Conteúdo da nova seção

```text
🩺 EXAME FÍSICO E MANOBRAS DIAGNÓSTICAS

Formato obrigatório:

📋 Inspeção:
• achado visual → significado clínico

🖐️ Palpação:
• achado palpável → significado clínico

🔨 Manobras específicas:
| Manobra | Como fazer | Achado positivo | O que indica |
| Sinal de Blumberg | Descompressão brusca do abdome | Dor à descompressão | Irritação peritoneal |

🔊 Ausculta (quando aplicável):
• achado auscultatório → significado

REGRAS:
- Sempre citar o NOME da manobra
- Descrever COMO realizar a manobra
- Explicar o que é um achado POSITIVO vs NEGATIVO
- Correlacionar achado → diagnóstico provável
- Incluir sensibilidade/especificidade quando conhecidas
- Mínimo de 2 manobras por tema (quando aplicável)
```

## Mudanças técnicas

### 1 arquivo editado: `supabase/functions/_shared/enazizi-prompt.ts`

1. Inserir seção **5½** "🩺 EXAME FÍSICO E MANOBRAS DIAGNÓSTICAS" entre manifestações clínicas e conduta
2. Renumerar itens 6-9 para 7-10
3. Adicionar na checklist pré-resposta (item 10): "Os achados de exame físico e manobras diagnósticas foram incluídos"
4. Na Mensagem 2 (Explicação Técnica + Aplicação Clínica), adicionar menção ao exame físico

## Impacto

- Zero mudança em rotas, edge functions ou lógica
- Apenas enriquece o prompt pedagógico
- O Tutor passará a ensinar **como diagnosticar na prática** com nome das manobras e achados esperados

