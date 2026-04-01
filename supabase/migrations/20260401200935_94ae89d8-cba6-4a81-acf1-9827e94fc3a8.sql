
-- 1. Remove duplicates (keep oldest or one with explanation)
DELETE FROM questions_bank a
USING questions_bank b
WHERE a.id > b.id
  AND a.is_global = true AND b.is_global = true
  AND LEFT(LOWER(TRIM(a.statement)), 80) = LEFT(LOWER(TRIM(b.statement)), 80)
  AND (b.explanation IS NOT NULL AND b.explanation != '' OR a.explanation IS NULL OR a.explanation = '');

-- 2. Normalize "Clínica Médica" and "ENARE" using subtopic mapping
UPDATE questions_bank SET topic = 'Cardiologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%cardio%' OR LOWER(subtopic) LIKE '%arritmi%' OR LOWER(subtopic) LIKE '%insuficiência cardíaca%'
  OR LOWER(statement) LIKE '%cardíac%' OR LOWER(statement) LIKE '%infarto%' OR LOWER(statement) LIKE '%fibrilação%');

UPDATE questions_bank SET topic = 'Pneumologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%pneumo%' OR LOWER(subtopic) LIKE '%pulmon%' OR LOWER(subtopic) LIKE '%asma%' OR LOWER(subtopic) LIKE '%dpoc%'
  OR LOWER(statement) LIKE '%pulmon%' OR LOWER(statement) LIKE '%pneumonia%' OR LOWER(statement) LIKE '%asma%');

UPDATE questions_bank SET topic = 'Neurologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%neuro%' OR LOWER(subtopic) LIKE '%epilep%' OR LOWER(subtopic) LIKE '%avc%' OR LOWER(subtopic) LIKE '%cefale%'
  OR LOWER(statement) LIKE '%neurológic%' OR LOWER(statement) LIKE '%acidente vascular%' OR LOWER(statement) LIKE '%epilep%');

UPDATE questions_bank SET topic = 'Endocrinologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%endocrin%' OR LOWER(subtopic) LIKE '%diabet%' OR LOWER(subtopic) LIKE '%tireo%' OR LOWER(subtopic) LIKE '%adrenal%'
  OR LOWER(statement) LIKE '%diabetes%' OR LOWER(statement) LIKE '%tireo%' OR LOWER(statement) LIKE '%insulina%');

UPDATE questions_bank SET topic = 'Gastroenterologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%gastro%' OR LOWER(subtopic) LIKE '%hepát%' OR LOWER(subtopic) LIKE '%hepat%' OR LOWER(subtopic) LIKE '%cirros%' OR LOWER(subtopic) LIKE '%pancrea%'
  OR LOWER(statement) LIKE '%hepát%' OR LOWER(statement) LIKE '%cirrose%' OR LOWER(statement) LIKE '%gástric%');

UPDATE questions_bank SET topic = 'Nefrologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%nefro%' OR LOWER(subtopic) LIKE '%renal%' OR LOWER(subtopic) LIKE '%diális%'
  OR LOWER(statement) LIKE '%renal%' OR LOWER(statement) LIKE '%nefr%' OR LOWER(statement) LIKE '%diálise%');

UPDATE questions_bank SET topic = 'Infectologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%infect%' OR LOWER(subtopic) LIKE '%hiv%' OR LOWER(subtopic) LIKE '%tuberc%' OR LOWER(subtopic) LIKE '%sepse%'
  OR LOWER(statement) LIKE '%infecç%' OR LOWER(statement) LIKE '%antibiótic%' OR LOWER(statement) LIKE '%hiv%');

UPDATE questions_bank SET topic = 'Hematologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%hemato%' OR LOWER(subtopic) LIKE '%anemia%' OR LOWER(subtopic) LIKE '%leucem%' OR LOWER(subtopic) LIKE '%coagul%'
  OR LOWER(statement) LIKE '%anemia%' OR LOWER(statement) LIKE '%leucócit%' OR LOWER(statement) LIKE '%plaqueta%');

UPDATE questions_bank SET topic = 'Reumatologia', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%reumato%' OR LOWER(subtopic) LIKE '%lúpus%' OR LOWER(subtopic) LIKE '%artrit%'
  OR LOWER(statement) LIKE '%reumat%' OR LOWER(statement) LIKE '%lúpus%' OR LOWER(statement) LIKE '%artrite%');

UPDATE questions_bank SET topic = 'Medicina Preventiva', subtopic = COALESCE(subtopic, topic)
WHERE topic IN ('Clínica Médica', 'ENARE') AND is_global = true
AND (LOWER(subtopic) LIKE '%prevent%' OR LOWER(subtopic) LIKE '%epidemio%' OR LOWER(subtopic) LIKE '%sus%' OR LOWER(subtopic) LIKE '%saúde públ%'
  OR LOWER(statement) LIKE '%epidemiológic%' OR LOWER(statement) LIKE '%sus %' OR LOWER(statement) LIKE '%vigilância%');

-- Catch remaining Clínica Médica/ENARE → keep as Clínica Médica (better than ENARE)
UPDATE questions_bank SET topic = 'Clínica Médica' WHERE topic = 'ENARE' AND is_global = true;

-- 3. Normalize fragmented subtopics to parent specialties
UPDATE questions_bank SET subtopic = topic, topic = 'Microbiologia'
WHERE topic IN ('Bactérias Gram-negativas','Bactérias Gram-positivas','Bacteriologia Geral','Virologia') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Infectologia'
WHERE topic IN ('Infecções Hospitalares','Hanseníase','Doenças Infecciosas Pediátricas','Dermatologia Infecciosa') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Endocrinologia'
WHERE topic IN ('Hiperparatireoidismo','Hipertireoidismo','Tireoide','Adrenal') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Nefrologia'
WHERE topic = 'Infecção Urinária' AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Otorrinolaringologia'
WHERE topic IN ('Perda Auditiva','Epistaxe','Vertigem','Amigdalite') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Urologia'
WHERE topic IN ('Varicocele','Varizes') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Oncologia'
WHERE topic IN ('Terapia-Alvo','Radioterapia') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Pediatria'
WHERE topic IN ('Nutrição Infantil','Vacinação') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Medicina Preventiva'
WHERE topic IN ('Medicina Preventiva - SUS','Medicina Preventiva - Epidemiologia','Medicina Preventiva - Atenção Básica') AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Parasitologia'
WHERE topic = 'Parasitologia Médica' AND is_global = true;

UPDATE questions_bank SET subtopic = topic, topic = 'Embriologia'
WHERE topic = 'Teratogênese, Anomalias Congênitas' AND is_global = true;
