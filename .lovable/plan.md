

## Plano: Adicionar Diagnósticos Diferenciais, Pegadinhas e Mnemônicos ao Prompt ENAZIZI

O usuário pediu para criar um checkpoint (para reverter se necessário) e implementar as melhorias propostas.

**Checkpoint**: O usuário pode reverter a qualquer momento usando o botão de revert abaixo desta mensagem ou pelo histórico.

### Alterações no arquivo `supabase/functions/_shared/enazizi-prompt.ts`

**1. Expandir a estrutura obrigatória (após linha 111)**

Adicionar 3 novas seções após "5️⃣ Conduta clínica":

```
6️⃣ Diagnósticos diferenciais
Formato obrigatório — tabela comparativa:
| Doença | Achado-chave | Diferença principal |
Incluir no mínimo 3 diagnósticos diferenciais relevantes.

7️⃣ Pegadinhas de prova
Formato:
⚠️ pegadinha → explicação do erro comum
Listar 2-4 armadilhas clássicas de residência/Revalida.

8️⃣ Mnemônico (quando aplicável)
Formato:
🧠 "SIGLA" → significado de cada letra
Criar ou citar mnemônicos consagrados para o tema.
```

**2. Atualizar sequência de entrega (linhas 35-43)**

```
Mensagem 1: 🔬 EXPLICAÇÃO TÉCNICA + 💡 EXPLICAÇÃO PARA LEIGO
Mensagem 2: 🏥 APLICAÇÃO CLÍNICA + 💊 CONDUTA CLÍNICA + 🔀 DIAGNÓSTICOS DIFERENCIAIS
Mensagem 3: ⚠️ PEGADINHAS + 🧠 MNEMÔNICO + 📋 RESUMO + 📚 REFERÊNCIAS → ❓ PERGUNTA
```

**3. Atualizar exemplo de formato esperado (após linha 207)**

Adicionar ao exemplo de IC:
- Tabela de diferenciais (IC vs TEP vs DPOC vs Pneumonia)
- Pegadinha: "BNP elevado isolado não confirma IC"
- Mnemônico: "CHAMP" para causas de descompensação

**4. Atualizar marcadores de bloco (após linha 231)**

Adicionar:
```
🔀 DIAGNÓSTICOS DIFERENCIAIS
⚠️ PEGADINHAS DE PROVA
🧠 MNEMÔNICO
```

### O que NÃO muda
- Todas as regras visuais, clareza e espaçamento permanecem intactas
- Regras de continuidade e integridade de conteúdo permanecem intactas
- Nenhum arquivo frontend alterado

### Impacto
- Arquivo: `supabase/functions/_shared/enazizi-prompt.ts`
- Redeploy automático das edge functions que importam o prompt

