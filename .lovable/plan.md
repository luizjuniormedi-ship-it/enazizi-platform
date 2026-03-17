

# Controle de Acesso por Módulo no Gerenciador de Usuários

## Objetivo
Permitir que o admin controle quais módulos/páginas cada usuário pode acessar, diretamente pelo painel de gerenciamento.

## Arquitetura

### 1. Nova tabela: `user_module_access`
Armazena os módulos liberados por usuário. Se o usuário não tiver registro, usa um conjunto padrão baseado no plano.

```text
user_module_access
├── id (uuid, PK)
├── user_id (uuid, NOT NULL)
├── module_key (text, NOT NULL)  -- ex: "flashcards", "simulados", "chatgpt"
├── enabled (boolean, default true)
├── granted_by (uuid, nullable)  -- admin que concedeu
├── created_at (timestamptz)
└── UNIQUE(user_id, module_key)
```

RLS: admins podem CRUD tudo; usuários podem ler os próprios registros.

### 2. Módulos disponíveis (baseados no sidebar)
Lista fixa de ~20 módulos: `dashboard`, `chatgpt`, `plano-dia`, `diagnostico`, `cronograma`, `flashcards`, `gerar-flashcards`, `resumos`, `simulados`, `simulado-completo`, `questoes`, `banco-questoes`, `discursivas`, `anamnese`, `plantao`, `predictor`, `banco-erros`, `mapa-dominio`, `proficiencia`, `coach`, `conquistas`, `analytics`.

### 3. Alterações no Admin (`src/pages/Admin.tsx`)
- Novo botão "🔑 Acessos" na linha de ações de cada usuário
- Dialog com grid de checkboxes/switches para cada módulo
- Salvar/atualizar registros na tabela `user_module_access`
- Nova action `get_user_access` e `set_user_access` na edge function `admin-actions`

### 4. Alterações na Edge Function (`supabase/functions/admin-actions/index.ts`)
- `get_user_access`: retorna módulos habilitados do usuário
- `set_user_access`: upsert dos módulos selecionados + audit log

### 5. Hook `useModuleAccess` + proteção no sidebar
- Novo hook `src/hooks/useModuleAccess.ts` que carrega os módulos do usuário logado
- `DashboardSidebar.tsx` filtra os itens de navegação baseado nos módulos habilitados
- Itens desabilitados ficam ocultos ou com visual de "bloqueado"

### 6. Proteção nas rotas
- Componente wrapper opcional que redireciona se o módulo não está liberado

## Fluxo
```text
Admin clica "Acessos" → Dialog com switches por módulo
  → Salva via edge function → user_module_access atualizado
  → Usuário recarrega sidebar → vê apenas módulos liberados
```

## Arquivos alterados/criados
1. **Migração SQL** — criar tabela `user_module_access` com RLS
2. **`supabase/functions/admin-actions/index.ts`** — 2 novas actions
3. **`src/hooks/useModuleAccess.ts`** — novo hook
4. **`src/pages/Admin.tsx`** — botão + dialog de acessos
5. **`src/components/layout/DashboardSidebar.tsx`** — filtrar itens pelo acesso

