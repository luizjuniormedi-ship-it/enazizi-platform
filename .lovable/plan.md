

# Corrigir Mensagem Personalizada no WhatsApp

## Problema
Quando o admin digita uma mensagem personalizada, o sistema envia o texto exatamente como digitado para **todos** os alunos — sem substituir o nome de cada um. O admin escreveu `{Luiz Júnior} teste` (literalmente) e todos os 43 alunos receberam essa mesma mensagem com o nome errado.

O placeholder `{nome}` existe no código mas não é óbvio para o usuário. Além disso, se o admin não usa `{nome}`, o sistema deveria automaticamente adicionar o nome do aluno no início da mensagem.

## Solução

### `src/components/admin/WhatsAppPanel.tsx`

1. **Melhorar o placeholder do textarea** para deixar claro como usar `{nome}`:
   - Trocar para: `"Olá {nome}! Sua mensagem aqui... (use {nome} para inserir o nome do aluno automaticamente)"`

2. **Auto-prefixar o nome se `{nome}` não foi usado**: Na lógica de override (linhas 210-216), se o `customMessage` não contém `{nome}`, prefixar automaticamente com `"Olá {firstName}! "` antes do texto do admin.

3. **Adicionar dica visual** abaixo do textarea informando: `"Use {nome} para personalizar. Se não usar, o nome será adicionado automaticamente no início."`

```text
Antes:  Admin digita "teste" → todos recebem "teste" (sem nome)
Depois: Admin digita "teste" → cada aluno recebe "Olá [Nome]! teste"
        Admin digita "{nome}, teste" → cada aluno recebe "[Nome], teste"
```

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/WhatsAppPanel.tsx` | Auto-prefixar nome quando `{nome}` ausente; melhorar placeholder e dica |

