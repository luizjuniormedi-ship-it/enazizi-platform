
-- 1. Add subtopic column
ALTER TABLE questions_bank ADD COLUMN IF NOT EXISTS subtopic text;

-- 2. Case normalization
UPDATE questions_bank SET topic = 'Cardiologia' WHERE topic = 'cardiologia';
UPDATE questions_bank SET topic = 'Cirurgia' WHERE topic = 'cirurgia';
UPDATE questions_bank SET topic = 'Pediatria' WHERE topic = 'pediatria';
UPDATE questions_bank SET topic = 'Pneumologia' WHERE topic = 'pneumologia';
UPDATE questions_bank SET topic = 'Dermatologia' WHERE topic = 'dermatologia';

-- 3. Synonym consolidation
UPDATE questions_bank SET topic = 'Ginecologia e Obstetrícia' WHERE topic IN ('Ginecologia', 'Ginecologia - Endocrinologia Ginecológica');
UPDATE questions_bank SET topic = 'Cirurgia' WHERE topic IN ('Cirurgia Geral', 'Cirurgia Geral e do Aparelho Digestivo');
UPDATE questions_bank SET subtopic = 'Trauma', topic = 'Cirurgia' WHERE topic = 'Cirurgia do Trauma';
UPDATE questions_bank SET topic = 'Medicina de Emergência' WHERE topic = 'Emergência';
UPDATE questions_bank SET topic = 'Medicina Preventiva' WHERE topic IN ('Medicina Preventiva e Saúde Coletiva', 'Saúde Coletiva', 'Saúde Pública');
UPDATE questions_bank SET topic = 'Angiologia' WHERE topic = 'Angiologia e Cirurgia Vascular';
UPDATE questions_bank SET topic = 'Clínica Médica' WHERE topic IN ('Clínica médica', 'clinica medica');

-- 4. Cardiologia compound topics - extract subtopic using LIKE patterns
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Cardiologia - ', ''), topic = 'Cardiologia' WHERE topic LIKE 'Cardiologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Cardiologia / ', ''), topic = 'Cardiologia' WHERE topic LIKE 'Cardiologia / %' AND subtopic IS NULL;

-- 5. Other compound topics with " - " separator
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Cirurgia - ', ''), topic = 'Cirurgia' WHERE topic LIKE 'Cirurgia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Pediatria - ', ''), topic = 'Pediatria' WHERE topic LIKE 'Pediatria - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Pneumologia - ', ''), topic = 'Pneumologia' WHERE topic LIKE 'Pneumologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Neurologia - ', ''), topic = 'Neurologia' WHERE topic LIKE 'Neurologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Endocrinologia - ', ''), topic = 'Endocrinologia' WHERE topic LIKE 'Endocrinologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Gastroenterologia - ', ''), topic = 'Gastroenterologia' WHERE topic LIKE 'Gastroenterologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Nefrologia - ', ''), topic = 'Nefrologia' WHERE topic LIKE 'Nefrologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Infectologia - ', ''), topic = 'Infectologia' WHERE topic LIKE 'Infectologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Hematologia - ', ''), topic = 'Hematologia' WHERE topic LIKE 'Hematologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Reumatologia - ', ''), topic = 'Reumatologia' WHERE topic LIKE 'Reumatologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Psiquiatria - ', ''), topic = 'Psiquiatria' WHERE topic LIKE 'Psiquiatria - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Oncologia - ', ''), topic = 'Oncologia' WHERE topic LIKE 'Oncologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Dermatologia - ', ''), topic = 'Dermatologia' WHERE topic LIKE 'Dermatologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Oftalmologia - ', ''), topic = 'Oftalmologia' WHERE topic LIKE 'Oftalmologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Otorrinolaringologia - ', ''), topic = 'Otorrinolaringologia' WHERE topic LIKE 'Otorrinolaringologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Medicina Preventiva - ', ''), topic = 'Medicina Preventiva' WHERE topic LIKE 'Medicina Preventiva - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Medicina de Emergência - ', ''), topic = 'Medicina de Emergência' WHERE topic LIKE 'Medicina de Emergência - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Terapia Intensiva - ', ''), topic = 'Terapia Intensiva' WHERE topic LIKE 'Terapia Intensiva - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Semiologia - ', ''), topic = 'Semiologia' WHERE topic LIKE 'Semiologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Farmacologia - ', ''), topic = 'Farmacologia' WHERE topic LIKE 'Farmacologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Anatomia - ', ''), topic = 'Anatomia' WHERE topic LIKE 'Anatomia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Fisiologia - ', ''), topic = 'Fisiologia' WHERE topic LIKE 'Fisiologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Ginecologia e Obstetrícia - ', ''), topic = 'Ginecologia e Obstetrícia' WHERE topic LIKE 'Ginecologia e Obstetrícia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Urologia - ', ''), topic = 'Urologia' WHERE topic LIKE 'Urologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Ortopedia - ', ''), topic = 'Ortopedia' WHERE topic LIKE 'Ortopedia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Imunologia - ', ''), topic = 'Imunologia' WHERE topic LIKE 'Imunologia - %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Patologia - ', ''), topic = 'Patologia' WHERE topic LIKE 'Patologia - %' AND subtopic IS NULL;

-- Clínica Médica compound
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Clínica Médica - ', ''), topic = 'Clínica Médica' WHERE topic LIKE 'Clínica Médica - %' AND subtopic IS NULL;

-- Compound with "/"
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Nefrologia / ', ''), topic = 'Nefrologia' WHERE topic LIKE 'Nefrologia / %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Infectologia / ', ''), topic = 'Infectologia' WHERE topic LIKE 'Infectologia / %' AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = regexp_replace(topic, '^Emergência / ', ''), topic = 'Medicina de Emergência' WHERE topic LIKE 'Emergência / %' AND subtopic IS NULL;

-- 6. Standalone condition topics → parent specialty + subtopic
UPDATE questions_bank SET subtopic = 'Abdome Agudo', topic = 'Cirurgia' WHERE topic = 'Abdome Agudo';
UPDATE questions_bank SET subtopic = 'Apendicite', topic = 'Cirurgia' WHERE topic IN ('Apendicite', 'Apendicite Aguda');
UPDATE questions_bank SET subtopic = 'Colecistite', topic = 'Cirurgia' WHERE topic IN ('Colecistite e Colelitíase', 'Colecistite Aguda', 'Colecistite');
UPDATE questions_bank SET subtopic = 'Hérnia Inguinal', topic = 'Cirurgia' WHERE topic IN ('Hérnia Inguinal', 'Hérnias');
UPDATE questions_bank SET subtopic = 'Obstrução Intestinal', topic = 'Cirurgia' WHERE topic = 'Obstrução Intestinal';
UPDATE questions_bank SET subtopic = 'Diverticulite', topic = 'Cirurgia' WHERE topic = 'Diverticulite';
UPDATE questions_bank SET subtopic = 'Queimaduras', topic = 'Cirurgia' WHERE topic = 'Queimaduras';
UPDATE questions_bank SET subtopic = 'Antibioticoprofilaxia Cirúrgica', topic = 'Cirurgia' WHERE topic = 'Antibioticoprofilaxia Cirúrgica';

UPDATE questions_bank SET subtopic = 'Pancreatite Aguda', topic = 'Gastroenterologia' WHERE topic = 'Pancreatite Aguda';
UPDATE questions_bank SET subtopic = 'Hepatologia', topic = 'Gastroenterologia' WHERE topic = 'Hepatologia';
UPDATE questions_bank SET subtopic = 'Doença do Refluxo', topic = 'Gastroenterologia' WHERE topic = 'Doença do Refluxo Gastroesofágico';
UPDATE questions_bank SET subtopic = 'Hepatite B', topic = 'Gastroenterologia' WHERE topic = 'Hepatite B';

UPDATE questions_bank SET subtopic = 'Politrauma', topic = 'Medicina de Emergência' WHERE topic IN ('Politrauma e ATLS', 'Politrauma');
UPDATE questions_bank SET subtopic = 'Choque', topic = 'Medicina de Emergência' WHERE topic IN ('Choque Hipovolêmico', 'Choque Séptico', 'Choque');
UPDATE questions_bank SET subtopic = 'Anafilaxia', topic = 'Medicina de Emergência' WHERE topic = 'Anafilaxia';
UPDATE questions_bank SET subtopic = 'Afogamento', topic = 'Medicina de Emergência' WHERE topic = 'Afogamento';
UPDATE questions_bank SET subtopic = 'Intoxicações', topic = 'Medicina de Emergência' WHERE topic LIKE 'Intoxicação%';

UPDATE questions_bank SET subtopic = 'Cetoacidose Diabética', topic = 'Endocrinologia' WHERE topic = 'Cetoacidose Diabética';
UPDATE questions_bank SET subtopic = 'Nódulo Tireoidiano', topic = 'Endocrinologia' WHERE topic = 'Nódulo Tireoidiano';
UPDATE questions_bank SET subtopic = 'Diabetes Mellitus', topic = 'Endocrinologia' WHERE topic IN ('Diabetes Mellitus', 'Diabetes Mellitus Tipo 2');
UPDATE questions_bank SET subtopic = 'Hipotireoidismo', topic = 'Endocrinologia' WHERE topic = 'Hipotireoidismo';

UPDATE questions_bank SET subtopic = 'Neonatologia', topic = 'Pediatria' WHERE topic = 'Neonatologia';
UPDATE questions_bank SET subtopic = 'Doenças Exantemáticas', topic = 'Pediatria' WHERE topic = 'Doenças Exantemáticas';
UPDATE questions_bank SET subtopic = 'Infecções Respiratórias', topic = 'Pediatria' WHERE topic = 'Infecções Respiratórias Pediátricas';
UPDATE questions_bank SET subtopic = 'Infecções', topic = 'Pediatria' WHERE topic = 'Doenças Infecciosas Pediátricas';
UPDATE questions_bank SET subtopic = 'Asma Infantil', topic = 'Pediatria' WHERE topic = 'Asma Infantil';
UPDATE questions_bank SET subtopic = 'Aleitamento Materno', topic = 'Pediatria' WHERE topic = 'Aleitamento Materno';
UPDATE questions_bank SET subtopic = 'Alimentação Complementar', topic = 'Pediatria' WHERE topic LIKE 'Alimentação Complementar%';
UPDATE questions_bank SET subtopic = 'Puericultura', topic = 'Pediatria' WHERE topic LIKE 'Antropometria%' OR topic = 'Puericultura';

UPDATE questions_bank SET subtopic = 'Pneumonia', topic = 'Pneumologia' WHERE topic = 'Pneumonia Comunitária';
UPDATE questions_bank SET subtopic = 'Tuberculose', topic = 'Pneumologia' WHERE topic = 'Tuberculose Pulmonar';

UPDATE questions_bank SET subtopic = 'IRA', topic = 'Nefrologia' WHERE topic = 'Insuficiência Renal Aguda';
UPDATE questions_bank SET subtopic = 'DRC', topic = 'Nefrologia' WHERE topic = 'Doença Renal Crônica';
UPDATE questions_bank SET subtopic = 'Distúrbios Hidroeletrolíticos', topic = 'Nefrologia' WHERE topic = 'Distúrbios Hidroeletrolíticos';

UPDATE questions_bank SET subtopic = 'Hipertensão Arterial', topic = 'Cardiologia' WHERE topic IN ('hipertensão arterial', 'Hipertensão Arterial', 'Hipertensão Arterial Sistêmica');
UPDATE questions_bank SET subtopic = 'Insuficiência Cardíaca', topic = 'Cardiologia' WHERE topic = 'Insuficiência Cardíaca';
UPDATE questions_bank SET subtopic = 'IAM', topic = 'Cardiologia' WHERE topic IN ('IAM e SCA', 'IAM', 'Infarto Agudo do Miocárdio');
UPDATE questions_bank SET subtopic = 'Arritmias', topic = 'Cardiologia' WHERE topic IN ('Arritmias Cardíacas', 'Arritmias Cardíacas e CDI', 'Arritmias e Insuficiência Cardíaca');
UPDATE questions_bank SET subtopic = 'Betabloqueadores', topic = 'Cardiologia' WHERE topic IN ('Betabloqueadores', 'Betabloqueadores / IAM');

UPDATE questions_bank SET subtopic = 'HIV/AIDS', topic = 'Infectologia' WHERE topic = 'HIV/AIDS';
UPDATE questions_bank SET subtopic = 'Tuberculose', topic = 'Infectologia' WHERE topic = 'Tuberculose';
UPDATE questions_bank SET subtopic = 'Dengue', topic = 'Infectologia' WHERE topic = 'Dengue';
UPDATE questions_bank SET subtopic = 'Meningite', topic = 'Infectologia' WHERE topic IN ('Meningite Bacteriana', 'Meningite');

UPDATE questions_bank SET subtopic = 'Anemia Falciforme', topic = 'Hematologia' WHERE topic = 'Anemia Falciforme';
UPDATE questions_bank SET subtopic = 'Anemias', topic = 'Hematologia' WHERE topic = 'Anemias';

UPDATE questions_bank SET subtopic = 'LES', topic = 'Reumatologia' WHERE topic IN ('LES', 'Lúpus Eritematoso Sistêmico');
UPDATE questions_bank SET subtopic = 'Artrite Reumatoide', topic = 'Reumatologia' WHERE topic = 'Artrite Reumatoide';
UPDATE questions_bank SET subtopic = 'Artrose', topic = 'Ortopedia' WHERE topic = 'Artrose';

UPDATE questions_bank SET subtopic = 'AVC Isquêmico', topic = 'Neurologia' WHERE topic IN ('AVC Isquêmico', 'AVC Isquêmico e Hemorrágico');
UPDATE questions_bank SET subtopic = 'AVC Hemorrágico', topic = 'Neurologia' WHERE topic = 'AVC Hemorrágico';

UPDATE questions_bank SET subtopic = 'SUS', topic = 'Medicina Preventiva' WHERE topic IN ('Princípios do SUS', 'SUS');
UPDATE questions_bank SET subtopic = 'Notificação Compulsória', topic = 'Medicina Preventiva' WHERE topic = 'Doenças de Notificação Compulsória';
UPDATE questions_bank SET subtopic = 'Atenção Básica', topic = 'Medicina Preventiva' WHERE topic IN ('Atenção Básica', 'Atenção Básica - Atributos de Starfield', 'Atenção Primária e ESF');
UPDATE questions_bank SET subtopic = 'Bioestatística', topic = 'Medicina Preventiva' WHERE topic = 'Bioestatística';
UPDATE questions_bank SET subtopic = 'Bioética', topic = 'Medicina Preventiva' WHERE topic IN ('Bioética', 'Bioética / Cirurgia', 'Bioética/Prática Médica', 'Bioética/Urologia');

UPDATE questions_bank SET subtopic = 'Câncer Colorretal', topic = 'Oncologia' WHERE topic = 'Câncer Colorretal';
UPDATE questions_bank SET subtopic = 'Câncer Gástrico', topic = 'Oncologia' WHERE topic = 'Câncer Gástrico';
UPDATE questions_bank SET subtopic = 'Câncer de Próstata', topic = 'Oncologia' WHERE topic IN ('Câncer de Próstata', 'Câncer de Próstata - Estadiamento e Estratificação de Risco');
UPDATE questions_bank SET subtopic = 'Câncer de Bexiga', topic = 'Oncologia' WHERE topic = 'Câncer de Bexiga';
UPDATE questions_bank SET subtopic = 'Acne Vulgar', topic = 'Dermatologia' WHERE topic = 'Acne Vulgar';

UPDATE questions_bank SET subtopic = 'Torção Testicular', topic = 'Urologia' WHERE topic = 'Torção Testicular';
UPDATE questions_bank SET subtopic = 'Hiperplasia Prostática', topic = 'Urologia' WHERE topic = 'Hiperplasia Prostática';
UPDATE questions_bank SET subtopic = 'Litíase Renal', topic = 'Urologia' WHERE topic = 'Litíase Renal';

-- 7. Anatomy subtopics
UPDATE questions_bank SET subtopic = 'Abdominal', topic = 'Anatomia' WHERE topic = 'Anatomia Abdominal';
UPDATE questions_bank SET subtopic = 'Membro Inferior', topic = 'Anatomia' WHERE topic = 'Anatomia do Membro Inferior';
UPDATE questions_bank SET subtopic = 'Membro Superior', topic = 'Anatomia' WHERE topic = 'Anatomia do Membro Superior';
UPDATE questions_bank SET subtopic = 'Pescoço', topic = 'Anatomia' WHERE topic = 'Anatomia do Pescoço';
UPDATE questions_bank SET subtopic = 'Estômago', topic = 'Anatomia' WHERE topic = 'Anatomia do Estômago';
UPDATE questions_bank SET subtopic = 'Cavidade Oral', topic = 'Anatomia' WHERE topic IN ('Anatomia da Cavidade Oral', 'Anatomia da Cavidade Oral e Faringe');
UPDATE questions_bank SET subtopic = 'Nasal', topic = 'Anatomia' WHERE topic = 'Anatomia Nasal';
UPDATE questions_bank SET subtopic = 'Ouvido', topic = 'Anatomia' WHERE topic = 'Anatomia do Ouvido';
UPDATE questions_bank SET subtopic = 'Palato', topic = 'Anatomia' WHERE topic = 'Anatomia do Palato';
UPDATE questions_bank SET subtopic = 'Fisiologia', topic = 'Anatomia' WHERE topic = 'Anatomia e Fisiologia';
UPDATE questions_bank SET subtopic = 'Faringe', topic = 'Anatomia' WHERE topic LIKE 'Anatomia da Faringe%';
UPDATE questions_bank SET subtopic = 'Língua', topic = 'Anatomia' WHERE topic LIKE 'Anatomia da Língua%';

-- 8. Semiologia subtopics
UPDATE questions_bank SET subtopic = 'Cardiovascular', topic = 'Semiologia' WHERE topic = 'Semiologia Cardiovascular';
UPDATE questions_bank SET subtopic = 'Anamnese', topic = 'Semiologia' WHERE topic = 'Anamnese';
UPDATE questions_bank SET subtopic = 'Exame Neurológico', topic = 'Semiologia' WHERE topic = 'Exame Neurológico';
UPDATE questions_bank SET subtopic = 'Exame Físico', topic = 'Semiologia' WHERE topic LIKE 'Exame Físico%';

-- 9. Compound with "/" that reference other specialties
UPDATE questions_bank SET subtopic = split_part(topic, '/', 2), topic = split_part(topic, '/', 1) WHERE topic LIKE '%/%' AND topic NOT LIKE 'Cardiologia%' AND topic NOT LIKE 'Nefrologia%' AND topic NOT LIKE 'Infectologia%' AND topic NOT LIKE 'Emergência%' AND subtopic IS NULL;

-- Trim any whitespace from subtopic extraction
UPDATE questions_bank SET subtopic = trim(subtopic) WHERE subtopic IS NOT NULL AND subtopic != trim(subtopic);
UPDATE questions_bank SET topic = trim(topic) WHERE topic != trim(topic);

-- 10. Garbage topics (broken data)
UPDATE questions_bank SET topic = 'Geral' WHERE topic IN ('!', 'Abrangência do Conteúdo') OR topic LIKE 'Alternativa%';

-- 11. Remaining standalone conditions → map to parent specialty
UPDATE questions_bank SET subtopic = topic, topic = 'Pediatria' WHERE topic IN ('Pediatria Geral', 'Crescimento e Desenvolvimento', 'Vacinação') AND subtopic IS NULL;
UPDATE questions_bank SET subtopic = topic, topic = 'Angiologia' WHERE topic LIKE 'Doença Arterial%' OR topic LIKE 'Trombose%' OR topic LIKE 'Insuficiência Venosa%' OR topic = 'Varizes' AND subtopic IS NULL;

-- Anestesiologia → map to appropriate parent
UPDATE questions_bank SET subtopic = 'Anestesiologia', topic = 'Cirurgia' WHERE topic LIKE 'Anestesiologia%' AND subtopic IS NULL;
