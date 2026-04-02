

# Incluir Instrução de Navegação nas Mensagens WhatsApp do Professor

## Problema
As mensagens de WhatsApp enviadas quando o professor cria atividades (simulados, casos clínicos, temas de estudo) dizem apenas "Acesse a plataforma para realizar" — sem orientar o aluno sobre onde encontrar a atividade dentro do app.

## Solução
Atualizar as 3 mensagens WhatsApp e as 3 notificações in-app no `professor-simulado/index.ts` para incluir a instrução clara: **"Acesse a aba *Mais Ferramentas* e em seguida *Proficiência*"**.

### Alterações em `supabase/functions/professor-simulado/index.ts`

**1. Simulado — WhatsApp (linha ~283)**
De:
```
Acesse a plataforma para realizar!
```
Para:
```
👉 Acesse *Mais Ferramentas* → *Proficiência* para realizar!
```

**2. Simulado — In-app (linha ~260)**
De:
```
Acesse a aba Proficiência para realizar.
```
Para:
```
Acesse a aba Mais Ferramentas → Proficiência para realizar.
```

**3. Caso Clínico — WhatsApp (linha ~844)**
De:
```
Acesse a plataforma para realizar!
```
Para:
```
👉 Acesse *Mais Ferramentas* → *Proficiência* para realizar!
```

**4. Caso Clínico — In-app (linha ~821)**
De:
```
Acesse a aba Proficiência para realizar.
```
Para:
```
Acesse a aba Mais Ferramentas → Proficiência para realizar.
```

**5. Tema de Estudo — WhatsApp (linha ~1019)**
De:
```
Acesse a plataforma para estudar!
```
Para:
```
👉 Acesse *Mais Ferramentas* → *Proficiência* para estudar!
```

**6. Tema de Estudo — In-app (linha ~996)**
De:
```
Acesse a aba Proficiência para estudar.
```
Para:
```
Acesse a aba Mais Ferramentas → Proficiência para estudar.
```

**7. Professor Reminder (cron) — `professor-reminder/index.ts` (linha ~55)**
De:
```
Acesse a aba Proficiência para realizar.
```
Para:
```
Acesse a aba Mais Ferramentas → Proficiência para realizar.
```

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/professor-simulado/index.ts` | Atualizar 6 mensagens (3 WhatsApp + 3 in-app) com instrução de navegação |
| `supabase/functions/professor-reminder/index.ts` | Atualizar mensagem do lembrete com instrução de navegação |

