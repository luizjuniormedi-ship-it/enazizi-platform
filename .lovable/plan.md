

# Acelerar Equalização + Corrigir Fragmentação de Tópicos

## Problemas

1. **Velocidade**: Gera 5-11 questões por chamada. Com ~3.000 questões faltantes, o processo é impraticável
2. **Fragmentação**: Subtópicos como "Neurointensivismo" (7), "Sepse e Choque Séptico" (6), "Ventilação Mecânica" (5) existem como tópicos separados em vez de estarem sob "Terapia Intensiva"
3. **UI**: O progresso não mostra estimativa de tempo nem total geral de questões faltantes

## Mudanças

### 1. Edge function `bulk-generate-content` — Aumentar batch e consolidar subtópicos

- Aumentar `batchSize` de 10 para **25** questões por chamada (o timeout já é 120s)
- Antes de calcular déficits, **agregar subtópicos fragmentados** no cálculo:
  - "Neurointensivismo", "Sepse e Choque Séptico", "Ventilação Mecânica", "Sedação e Analgesia", "Insuficiência Renal Aguda em UTI" → contar como parte de "Terapia Intensiva"
  - Subtópicos de Oftalmologia, Otorrinolaringologia, Angiologia → contar sob o tópico pai
- As novas questões geradas usam o **tópico pai normalizado** + campo `subtopic`

### 2. Migração SQL — Consolidar subtópicos órfãos

```sql
UPDATE questions_bank SET subtopic = topic, topic = 'Terapia Intensiva' 
WHERE topic IN ('Neurointensivismo','Sepse e Choque Séptico','Ventilação Mecânica','Sedação e Analgesia','Insuficiência Renal Aguda em UTI');

UPDATE questions_bank SET subtopic = topic, topic = 'Oftalmologia'
WHERE topic IN ('Retinopatia Diabética','Glaucoma','Catarata','Descolamento de Retina','Uveíte');

UPDATE questions_bank SET subtopic = topic, topic = 'Otorrinolaringologia'
WHERE topic IN ('Perda Auditiva','Câncer de Laringe','Vertigem','Amigdalite','Epistaxe');

UPDATE questions_bank SET subtopic = topic, topic = 'Angiologia'
WHERE topic IN ('Claudicação Intermitente','Isquemia Crítica de Membro','Pé Diabético Vascular','Insuficiência Venosa Crônica','Síndrome Compartimental');

UPDATE questions_bank SET subtopic = topic, topic = 'Bioquímica'
WHERE topic IN ('Bioquímica do Ciclo de Krebs','Metabolismo de Proteínas','Bioquímica Renal','Metabolismo de Lipídios','Erros Inatos do Metabolismo');
```

### 3. `AdminIngestionPanel.tsx` — UI de progresso melhorada

- Mostrar **total geral**: "Faltam X questões em Y especialidades"
- Barra de progresso global com estimativa de tempo (baseada em ~20s por batch)
- Log em tempo real com contagem acumulada
- Botão "Pausar" para interromper o loop

### 4. Redeploy da edge function

## Resultado

- Subtópicos consolidados: ~35 questões redistribuídas para tópicos pai
- Geração 2.5x mais rápida (25 por batch vs 10)
- Déficits reais recalculados corretamente após consolidação
- UI mostra progresso claro com ETA

