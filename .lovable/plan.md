

## Plano: Criar vídeo animado de resumo sobre Insuficiência Cardíaca

### O que será criado
Um vídeo MP4 de ~20 segundos com motion graphics educativo sobre Insuficiência Cardíaca, contendo:
- **Cena 1**: Título "Insuficiência Cardíaca" com animação de entrada dramática
- **Cena 2**: Definição e fisiopatologia com ícones animados (coração, setas)
- **Cena 3**: Classificação NYHA (I-IV) com tabela animada
- **Cena 4**: Diagnóstico (BNP, eco, RX) com bullets animados
- **Cena 5**: Tratamento (IECA/BRA, betabloq, diuréticos) com pilares animados

### Direção criativa
- **Paleta**: Azul médico (#1E3A5F), vermelho cardíaco (#E63946), branco (#F1FAEE), cinza escuro (#2B2D42)
- **Fontes**: Inter (títulos) + Source Sans (corpo)
- **Estilo**: Tech/Editorial médico — limpo, profissional, com transições suaves
- **Resolução**: 1920x1080, 30fps

### Como será feito
1. Criar projeto Remotion em `/tmp/medical-video/`
2. Instalar dependências (remotion, react, etc.)
3. Criar 5 cenas com animações frame-based (`interpolate` + `spring`)
4. Usar `TransitionSeries` para transições suaves entre cenas
5. Renderizar para `/mnt/documents/ic-resumo.mp4`

### Resultado
Arquivo MP4 baixável com resumo visual animado de Insuficiência Cardíaca — demonstração do conceito de "vídeos educacionais animados" para o Tutor IA.

### Detalhes técnicos
- Renderização via script programático (`scripts/render.mjs`) usando Chromium headless
- Sem áudio (versão visual apenas)
- Tempo estimado de render: ~2-3 minutos
- Todas animações via `useCurrentFrame()` + `interpolate()`/`spring()` (sem CSS animations)

