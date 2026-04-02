

# Padronizar Mensagens In-App do Professor com o Modelo WhatsApp

## Problema
As mensagens in-app (banner no dashboard do aluno) das atividades do professor estão com texto genérico e curto, enquanto as mensagens WhatsApp já têm o modelo correto com saudação, detalhes completos, horário e instrução de navegação.

**In-app atual (curto):**
> O Prof. João disponibilizou o simulado "Cardio" — 100 questões, tempo: 60min. Acesse a aba Mais Ferramentas → Proficiência para realizar.

**WhatsApp (modelo correto):**
> 📋 *Novo Simulado — Prof. João*
> Olá Maria! O Prof. João disponibilizou o simulado "Cardio" com 100 questões (60min).
> ⏰ Agendado: 05/04/2026 às 14:00
> 👉 Acesse *Mais Ferramentas* → *Proficiência* para realizar!

## Alteração

### `supabase/functions/professor-simulado/index.ts`

Atualizar o campo `content` dos 3 tipos de notificação in-app (simulado, caso clínico, tema de estudo) para incluir:

1. **Saudação personalizada** com o primeiro nome do aluno
2. **Detalhes completos** (número de questões, tempo, especialidade, dificuldade)
3. **Horário agendado** quando aplicável
4. **Instrução de navegação** clara com emojis
5. **Link do app**

Exemplo do novo formato in-app para simulado:
```
📋 Olá {nome}! O Prof. {professor} disponibilizou o simulado "{título}" com {N} questões ({tempo}min).
⏰ Agendado: {data/hora}
👉 Acesse Mais Ferramentas → Proficiência para realizar!
🔗 https://enazizi.com
```

Mesma padronização para caso clínico e tema de estudo.

**Nota:** O `display_name` do aluno já está disponível no `studentList` para simulados (via `profiles` join). Para casos clínicos e temas de estudo, já temos acesso ao `phoneProfiles` — precisarei garantir que o nome do aluno esteja acessível no momento da criação da notificação in-app.

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Enriquecer `content` das 3 notificações in-app (simulado, caso clínico, tema) com saudação, detalhes, horário e instrução de navegação |

