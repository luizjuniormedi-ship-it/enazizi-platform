

# Atualizar Estatísticas em Tempo Real na Página de Login

## Resumo
Trocar os valores estáticos (hardcoded) de alunos, questões e flashcards por consultas em tempo real ao banco de dados, para que a página de login sempre mostre os números atualizados.

## Dados atuais no banco
- Alunos: **155** (exibindo "160+")
- Questões: **177** (exibindo "6.700+") — nota: provavelmente há outra tabela de questões, preciso verificar
- Flashcards: **6.127** (exibindo "6.100+")

## Alterações

### `src/pages/Login.tsx`
1. Importar `useEffect`, `useState` e o cliente Supabase
2. Criar um hook interno que ao montar o componente busca:
   - `COUNT(*)` de `profiles` com `user_type = 'estudante'` → Alunos
   - `COUNT(*)` de `real_exam_questions` com `is_active = true` + `COUNT(*)` de `questions` (se existir) → Questões
   - `COUNT(*)` de `flashcards` → Flashcards
3. Formatar os números com sufixo "+" (ex: "6.100+")
4. Mover `stats` de constante estática para estado dinâmico, com valores iniciais como "—" até carregar
5. Agentes IA permanece fixo ("8") pois não é dado do banco

## Arquivos alterados
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Login.tsx` | Buscar contagens do banco e exibir dinamicamente |

