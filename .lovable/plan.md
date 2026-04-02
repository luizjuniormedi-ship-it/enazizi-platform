

# Adicionar Subtópicos Específicos às Especialidades

## Problema
Vários subtópicos reais de provas de residência estão faltando no mapeamento `SPECIALTY_SUBTOPICS`. Isso limita a granularidade da geração de questões e dos filtros no painel do professor e simulados.

## Alterações

### `src/constants/subtopics.ts`

Adicionar os subtópicos faltantes a cada especialidade (sem remover os existentes):

| Especialidade | Subtópicos a adicionar |
|---|---|
| **Pediatria** | "IVAS", "Pneumonia na Criança", "ITU na Criança", "Tuberculose na Criança", "Piodermites na Criança" |
| **Cardiologia** | "Crise Hipertensiva", "Doença Coronariana" |
| **Angiologia** | "Linfangite e Erisipela" |
| **Infectologia** | (já tem "HIV/AIDS", "Infecções Oportunistas", "Leptospirose" — ok) |
| **Dermatologia** | "Lesões Elementares da Pele", "Piodermites", "Dermatoviroses", "Dermatozoonoses" |
| **Gastroenterologia** | "Distúrbios Motores do Esôfago", "Dispepsia e Gastrite" |
| **Pneumologia** | "Propedêutica Respiratória", "Micoses Pulmonares" |
| **Oncologia** | (já tem "Câncer de Mama" — ok) |

### `src/lib/mapTopicToSpecialty.ts`

Adicionar keywords para os novos subtópicos garantirem mapeamento correto:
- Dermatologia: `"piodermite"`, `"dermatozoonose"`, `"dermatovirose"`, `"lesão elementar"`
- Angiologia: `"linfangite"`, `"erisipela"`
- Gastro: `"dispepsia"`, `"distúrbio motor"`
- Pneumo: `"micose pulmonar"`

| Arquivo | Mudança |
|---------|---------|
| `src/constants/subtopics.ts` | Adicionar ~15 subtópicos faltantes em 6 especialidades |
| `src/lib/mapTopicToSpecialty.ts` | Adicionar ~8 keywords para novos subtópicos |

