

# Atualizar Página de Login com Funcionalidades e Números Reais

## Dados Reais do Banco
- **147 alunos** cadastrados
- **6.747 questões** no banco (1.443 reais de provas + 5.304 IA)
- **5.704 flashcards** criados
- **8 agentes IA** especializados

## Mudanças em `src/pages/Login.tsx`

### Layout: Split-screen (desktop) / Stacked (mobile)
- **Lado esquerdo**: Painel de destaque com logo, números reais e features
  - Stats: "147+ alunos", "6.700+ questões", "5.700+ flashcards", "8 agentes IA"
  - Lista de funcionalidades com ícones: Tutor IA, Simulados, Flashcards FSRS, Painel Professor, Banco de Erros, Cronograma Inteligente
  - Background com gradiente da marca
- **Lado direito**: Formulário de login (mantém lógica atual intacta)

### Funcionalidades destacadas (ícones + texto curto)
- Tutor IA personalizado
- Simulados com gabarito comentado
- Flashcards com repetição espaçada (FSRS)
- Painel do Professor com BI
- Banco de erros inteligente
- Cronograma adaptativo

### Menção ao cadastro de professor
- Abaixo do link "Criar conta grátis", adicionar: "É professor? Cadastre-se e acesse o painel exclusivo"

### Responsivo
- Mobile: stats + features ficam acima do formulário em versão compacta
- Desktop: split 50/50

### Sem mudanças na lógica
- `handleLogin`, `handleForgotPassword`, error messages — tudo mantido

