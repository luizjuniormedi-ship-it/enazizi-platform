

# Corrigir Tela de Cadastro/Perfil no Mobile

## Problema

Na tela de "Complete seu cadastro" (`ProtectedRoute.tsx`) e na tela de registro (`Register.tsx`), no mobile:
1. O container usa `min-h-screen flex items-center justify-center` sem scroll, fazendo com que campos abaixo da dobra fiquem cortados/invisíveis
2. O `PopoverContent` do combobox de faculdade tem altura limitada e pode ficar clipado pelo container pai
3. O `CommandList` não tem `max-height` explícito, dificultando scroll na lista de universidades em telas pequenas

## Mudanças

### 1. ProtectedRoute.tsx — Container scrollável no mobile
- Trocar o container da tela de cadastro incompleto de `min-h-screen flex items-center justify-center` para `min-h-[100dvh] overflow-y-auto flex items-start sm:items-center justify-center py-8`
- Isso permite scroll vertical quando o formulário excede a tela no mobile

### 2. Register.tsx — Mesmo ajuste de scroll
- Aplicar o mesmo padrão de `overflow-y-auto` e `items-start` no mobile

### 3. FaculdadeCombobox.tsx — Melhorar dropdown no mobile
- Adicionar `max-h-[40vh]` ao `CommandList` para garantir que a lista tenha scroll interno
- Usar `className="w-[min(300px,90vw)]"` no `PopoverContent` para não ultrapassar a tela no mobile

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/auth/ProtectedRoute.tsx` | Container com overflow-y-auto e items-start no mobile |
| `src/pages/Register.tsx` | Mesmo ajuste de scroll |
| `src/components/FaculdadeCombobox.tsx` | max-h no CommandList, largura responsiva no PopoverContent |

