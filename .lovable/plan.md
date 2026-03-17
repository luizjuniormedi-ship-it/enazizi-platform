

# Agente IA para Disparo Automático de Mensagens WhatsApp

## O que será construído

Um **agente de IA integrado ao painel Admin** que automatiza todo o fluxo de geração e disparo de mensagens personalizadas via links `wa.me`. O agente analisa o cronograma de cada aluno, gera mensagens motivacionais personalizadas usando IA, e apresenta tudo pronto para o admin disparar com um clique.

## Arquitetura

```text
Admin clica "Gerar mensagens do dia"
  → Edge Function (whatsapp-agent) usa service_role
  → Busca profiles com phone + revisões pendentes + temas + streak
  → IA (Lovable AI) gera mensagem personalizada para cada aluno
  → Retorna lista pronta para o frontend
  → Admin clica "Enviar" → wa.me abre com mensagem pronta
  → Botão "Disparar todos" abre links sequencialmente
```

## Etapas de implementação

### 1. Migração: campo `phone` na tabela `profiles`
- `ALTER TABLE profiles ADD COLUMN phone text;`

### 2. Campo de telefone no perfil do aluno (`Profile.tsx`)
- Input com máscara `(XX) XXXXX-XXXX`
- Salva junto com os demais campos

### 3. Edge Function `whatsapp-agent`
- Recebe request do admin (validado via token + role check)
- Busca todos os profiles com `phone` preenchido (service_role)
- Para cada aluno, busca revisões pendentes (`revisoes` onde `status = 'pendente'` e `data_revisao <= hoje`) e temas estudados
- Chama Lovable AI (Gemini Flash) com contexto do aluno para gerar mensagem motivacional personalizada contendo:
  - Saudação pelo nome
  - Revisões do dia (temas, tipo, urgência)
  - Motivação baseada no progresso
  - Link do app
- Retorna array com `{ user_id, display_name, phone, message, revisoes_count, urgentes_count }`

### 4. Nova aba "WhatsApp" no Admin (`Admin.tsx`)
- Botão "Gerar mensagens do dia" que chama a edge function
- Lista de alunos com:
  - Nome, telefone, quantidade de revisões
  - Mensagem gerada pela IA (editável)
  - Botão "Enviar" → abre `https://wa.me/55{phone_limpo}?text={mensagem_encodada}`
  - Botão "Copiar"
- Botão "Disparar todos sequencialmente" (abre links com intervalo de 3s via `setTimeout`)
- Indicador de progresso do disparo

### 5. Registro no `config.toml`
- Adicionar `[functions.whatsapp-agent]` com `verify_jwt = false`

## Diferencial do agente IA

Ao invés de mensagens template fixas, a IA gera mensagens **únicas e personalizadas** para cada aluno, considerando:
- Quantidade e urgência das revisões pendentes
- Dias de atraso
- Especialidades dos temas
- Tom motivacional variado (evita repetição)

Isso torna a comunicação mais humana e eficaz, mesmo sendo semi-automatizada.

