

# Melhorias na Apresentação das Crônicas Médicas

## Problemas identificados

Com base na sessão replay e no código atual, a crônica está sendo renderizada de forma rápida e pouco legível porque:

1. **Streaming sem ritmo** — o texto chega em blocos brutos e vai empurrando tudo para baixo, sem dar tempo ao leitor de absorver
2. **Seções coladas** — o `ChronicleRenderer` divide por headings mas o espaçamento entre seções é insuficiente (só `space-y-4`)
3. **Container do assistente muito denso** — todo o conteúdo fica dentro de um `bg-secondary` sem respiro visual
4. **Falta indicador de progresso** — o leitor não sabe em que parte da crônica está (cenário, armadilha, conduta, questão)
5. **Scroll automático agressivo** — empurra direto pro final, impedindo leitura pausada
6. **Quick actions competem com conteúdo** — ficam no topo e somem do campo de visão

## Plano de implementação

### 1. Scroll suave e inteligente
- Mudar o scroll automático de `scrollTop = scrollHeight` para `scrollIntoView({ behavior: 'smooth', block: 'end' })` com debounce
- Só fazer auto-scroll se o usuário estiver perto do final (dentro de 200px); se rolou para cima para ler, parar o auto-scroll
- Adicionar botão "↓ Rolar ao final" flutuante quando não estiver no fundo

### 2. Melhorar espaçamento e tipografia do ChronicleRenderer
- Aumentar `space-y-4` para `space-y-6` entre seções
- Adicionar `py-1` extra nos `SectionBlock` com estilo
- Aumentar o tamanho dos headings de seção para `text-lg`/`text-xl`
- Adicionar uma linha divisória sutil entre grandes blocos narrativos

### 3. Barra de progresso da crônica
- Detectar seções-chave no conteúdo streaming (cenário, armadilha, pausa didática, questão) contando emojis/headings
- Mostrar uma barra de progresso fina no topo com os marcos: 🩺 → ⚠️ → ⚖️ → 📝
- Atualiza conforme o streaming avança

### 4. Remover bg-secondary do container do assistente
- O `ChronicleRenderer` já tem seus próprios cards coloridos por seção
- Remover o `bg-secondary` wrapper do assistente para deixar as seções "respirarem" com fundo transparente
- Manter apenas um padding lateral leve

### 5. Quick actions fixos no rodapé
- Mover os botões de ação rápida para ficarem acima do input, sempre visíveis
- Torná-los colapsáveis em um chip "⚡ Ações" no mobile

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/MedicalChronicles.tsx` | Scroll inteligente, barra de progresso, reposicionar quick actions, remover bg do assistant container |
| `src/components/chronicles/ChronicleRenderer.tsx` | Aumentar espaçamento, divisórias entre seções, tipografia maior |

