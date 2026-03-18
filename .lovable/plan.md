

# Plano: Chamada de Video no Painel do Professor

## Abordagem

Usar **Jitsi Meet** (gratuito, sem necessidade de API key) via iframe embutido. O professor cria uma sala, convida alunos por link/notificacao, e todos entram na mesma chamada dentro da plataforma.

## Mudancas

### 1. Nova aba "Sala de Aula" no ProfessorDashboard
- Adicionar tab "Video" com icone de camera no `ProfessorDashboard.tsx`
- Interface com:
  - Botao "Criar Sala" que gera um room ID unico
  - Campo para nome da sala
  - Lista de alunos online para convidar
  - Iframe do Jitsi Meet embutido quando a sala estiver ativa

### 2. Componente `VideoRoom.tsx`
- Embed do Jitsi Meet via iframe (`https://meet.jit.si/{room-id}`)
- Controles: iniciar/encerrar sala, copiar link de convite
- Display name do professor preenchido automaticamente
- Responsivo (ocupa area principal)

### 3. Tabela `video_rooms` no banco (opcional mas recomendado)
- Campos: `id`, `professor_id`, `room_code`, `title`, `status`, `created_at`
- Permite listar salas ativas para alunos
- RLS: professor gerencia proprias salas, alunos leem salas ativas

### 4. Notificacao para alunos
- Ao criar sala, alunos filtrados por faculdade/periodo veem notificacao no dashboard
- Link direto para entrar na chamada via Jitsi

### 5. Pagina/componente do aluno
- Aluno clica na notificacao e abre a sala de video em tela cheia ou modal
- Jitsi embed com nome do aluno preenchido

## Arquivos a criar/editar
- `src/components/professor/VideoRoom.tsx` -- componente principal da sala
- `src/pages/ProfessorDashboard.tsx` -- nova aba
- `src/pages/Dashboard.tsx` ou `NotificationBell.tsx` -- notificacao de sala ativa
- Migration SQL para tabela `video_rooms`

## Limitacoes
- Jitsi Meet gratuito tem limite de ~75 participantes simultaneos
- Qualidade depende da infraestrutura do Jitsi publico
- Nao ha gravacao automatica (recurso pago do Jitsi)

