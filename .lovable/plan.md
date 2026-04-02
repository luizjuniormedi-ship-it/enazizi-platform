

# Expansão Massiva de Subtópicos — Residência Médica

## Contexto
Após pesquisa nos 100 temas mais cobrados em provas de residência médica (fontes: MedProvas, Estratégia MED — USP, UNIFESP, SUS-SP, ENARE, Santa Casa), identifiquei **~40 subtópicos faltantes** no `SPECIALTY_SUBTOPICS` que são frequentemente cobrados.

## Subtópicos a Adicionar (por especialidade)

### Cirurgia (6 novos)
- Abdome Agudo Obstrutivo
- Doença Hemorroidária
- Úlcera Perfurada
- Doença Diverticular
- Isquemia Mesentérica
- Fístulas Digestivas

### Ginecologia e Obstetrícia (7 novos)
- Diabetes Gestacional
- Distócias
- Cesariana
- Trabalho de Parto Prematuro
- Puerpério
- Anticoncepção
- ISTs na Ginecologia

### Pediatria (7 novos)
- Reanimação Neonatal
- Icterícia Neonatal
- Infecções Congênitas (TORCH)
- Desidratação na Criança
- Meningite na Criança
- Febre sem Foco
- Convulsão Febril

### Medicina Preventiva (6 novos)
- Sistemas de Informação em Saúde
- Indicadores de Saúde
- Níveis de Prevenção
- Notificação Compulsória
- Ética e Bioética Médica
- Determinantes Sociais de Saúde

### Endocrinologia (2 novos)
- Síndrome Hiperosmolar
- Dislipidemias

### Infectologia (2 novos)
- Arboviroses
- Resistência Antimicrobiana

### Oncologia (2 novos)
- Câncer de Endométrio
- Câncer de Ovário

### Gastroenterologia (1 novo)
- Doença Diverticular

### Pneumologia (1 novo)
- Pneumonia Nosocomial

### Cardiologia (1 novo)
- Síndromes Coronarianas Agudas

### Medicina de Emergência (1 novo)
- Choque Hipovolêmico

### Neurologia (1 novo)
- Neuropatia Diabética

## Arquivos a Alterar

| Arquivo | Mudança |
|---------|---------|
| `src/constants/subtopics.ts` | Adicionar ~37 subtópicos faltantes em 12 especialidades |
| `src/lib/mapTopicToSpecialty.ts` | Adicionar keywords para novos subtópicos (arbovirose, diverticular, TORCH, puerpério, etc.) |

## Impacto
- Geração de questões mais granular no painel do professor
- Filtros mais precisos no banco de questões e simulados
- Mapeamento automático correto de questões extraídas de provas reais

