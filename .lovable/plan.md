

## Plano: Botao "Estudar Erros com Tutor IA" na tela de resultado da Proficiencia

Sim, e totalmente possivel e uma melhoria pedagogica excelente. O sistema ja possui o padrao de "Estudar com Tutor IA" implementado em outros modulos (Simulados, Banco de Questoes). A ideia e adicionar um botao proeminente na tela de resultado que redireciona o aluno ao Tutor IA com o contexto dos erros pre-carregado.

### O que sera feito

1. **Botao "Revisar Erros com Tutor IA" na tela de resultado** (`StudentSimulados.tsx`)
   - Adicionar um botao destacado apos o card de revisao das questoes
   - O botao usara `useNavigate` para redirecionar a `/dashboard/chatgpt`
   - Passara via query params ou state do router um resumo dos erros (temas errados, enunciados e respostas corretas)

2. **Receber contexto no Tutor IA** (`ChatGPT.tsx`)
   - Detectar quando o usuario chega vindo da Proficiencia (via `location.state`)
   - Auto-enviar uma mensagem inicial ao tutor com o contexto: "Errei X questoes no simulado Y. Os temas foram: [...]. Me ajude a revisar."
   - O Tutor IA recebera esse contexto e iniciara a revisao direcionada automaticamente

3. **Botoes individuais por questao errada**
   - Cada questao errada na revisao tambem tera um mini-botao "Estudar com Tutor" que envia apenas aquela questao especifica ao tutor

### Detalhes tecnicos
- Navegacao via `useNavigate("/dashboard/chatgpt", { state: { fromSimulado: true, errors: [...] } })`
- No `ChatGPT.tsx`, checar `location.state?.fromSimulado` e montar mensagem automatica
- Nenhuma alteracao de banco de dados necessaria

