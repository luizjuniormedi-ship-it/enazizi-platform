/**
 * Base Curriculum — Cronograma Extensivo 50 Semanas
 * 
 * Estrutura estratégica extraída do cronograma oficial de residência médica.
 * Usado pelo Study Engine como referência de cobertura temática, 
 * NÃO como cronograma rígido.
 */

export interface CurriculumTopic {
  topic: string;
  specialty: string;
  week: number;
}

export interface CurriculumWeek {
  week: number;
  topics: CurriculumTopic[];
}

/** All topics from the 50-week extensivo curriculum, mapped to specialties */
export const BASE_CURRICULUM: CurriculumTopic[] = [
  // Semana 1
  { week: 1, topic: "Atendimento Inicial ao Politraumatizado", specialty: "Cirurgia" },
  { week: 1, topic: "Vias Aéreas e Trauma Torácico", specialty: "Cirurgia" },
  { week: 1, topic: "Hipertensão Arterial Sistêmica - Diagnóstico", specialty: "Cardiologia" },
  // Semana 2
  { week: 2, topic: "Aleitamento Materno", specialty: "Pediatria" },
  { week: 2, topic: "Trauma - Choque", specialty: "Cirurgia" },
  { week: 2, topic: "Ciclo Menstrual", specialty: "Ginecologia e Obstetrícia" },
  { week: 2, topic: "Antibióticos", specialty: "Infectologia" },
  { week: 2, topic: "Introdução ao Diabetes Mellitus", specialty: "Endocrinologia" },
  // Semana 3
  { week: 3, topic: "Crescimento", specialty: "Pediatria" },
  { week: 3, topic: "Trauma Abdominal e Pélvico", specialty: "Cirurgia" },
  { week: 3, topic: "Princípios e Diretrizes do SUS", specialty: "Medicina Preventiva" },
  { week: 3, topic: "Pré-Natal", specialty: "Ginecologia e Obstetrícia" },
  { week: 3, topic: "Hipertensão Arterial Sistêmica - Tratamento", specialty: "Cardiologia" },
  { week: 3, topic: "Doença Renal Crônica", specialty: "Nefrologia" },
  // Semana 4
  { week: 4, topic: "Puberdade", specialty: "Pediatria" },
  { week: 4, topic: "Trauma em Populações Especiais", specialty: "Cirurgia" },
  { week: 4, topic: "Miomatose Uterina", specialty: "Ginecologia e Obstetrícia" },
  { week: 4, topic: "Tuberculose", specialty: "Infectologia" },
  { week: 4, topic: "Diabetes Mellitus Tipo 2", specialty: "Endocrinologia" },
  { week: 4, topic: "Semiologia Neurológica", specialty: "Neurologia" },
  // Semana 5
  { week: 5, topic: "Diagnóstico Nutricional", specialty: "Pediatria" },
  { week: 5, topic: "Trauma de Face e Cervical", specialty: "Cirurgia" },
  { week: 5, topic: "Marcos Legais do SUS", specialty: "Medicina Preventiva" },
  { week: 5, topic: "Bacia Obstétrica e Estática Fetal", specialty: "Ginecologia e Obstetrícia" },
  { week: 5, topic: "Crise Hipertensiva", specialty: "Cardiologia" },
  { week: 5, topic: "Introdução à Pneumologia", specialty: "Pneumologia" },
  // Semana 6
  { week: 6, topic: "Desenvolvimento Neuropsicomotor", specialty: "Pediatria" },
  { week: 6, topic: "Trauma Vascular e Musculoesquelético", specialty: "Cirurgia" },
  { week: 6, topic: "Adenomiose", specialty: "Ginecologia e Obstetrícia" },
  { week: 6, topic: "Leptospirose", specialty: "Infectologia" },
  { week: 6, topic: "Insulinoterapia e Cirurgia Metabólica", specialty: "Endocrinologia" },
  { week: 6, topic: "DRGE e Esofagites", specialty: "Gastroenterologia" },
  // Semana 7
  { week: 7, topic: "Deficiências Vitamínicas e Profilaxias", specialty: "Pediatria" },
  { week: 7, topic: "Queimaduras e Trauma Elétrico", specialty: "Cirurgia" },
  { week: 7, topic: "Financiamento em Saúde", specialty: "Medicina Preventiva" },
  { week: 7, topic: "Endometriose", specialty: "Ginecologia e Obstetrícia" },
  { week: 7, topic: "Mecanismo e Fases Clínicas do Parto", specialty: "Ginecologia e Obstetrícia" },
  // Semana 8
  { week: 8, topic: "Cuidados Neonatais", specialty: "Pediatria" },
  { week: 8, topic: "Abdome Agudo", specialty: "Cirurgia" },
  { week: 8, topic: "Malária", specialty: "Infectologia" },
  { week: 8, topic: "Complicações Agudas do Diabetes", specialty: "Endocrinologia" },
  { week: 8, topic: "Doença Renal Crônica - Parte II", specialty: "Nefrologia" },
  { week: 8, topic: "Coma e Alterações da Consciência", specialty: "Neurologia" },
  // Semana 9
  { week: 9, topic: "Reanimação Neonatal", specialty: "Pediatria" },
  { week: 9, topic: "Apendicite Aguda", specialty: "Cirurgia" },
  { week: 9, topic: "Descentralização e Regionalização do SUS", specialty: "Medicina Preventiva" },
  { week: 9, topic: "Pólipos Uterinos", specialty: "Ginecologia e Obstetrícia" },
  { week: 9, topic: "Partograma e Distocias", specialty: "Ginecologia e Obstetrícia" },
  { week: 9, topic: "Insuficiência Cardíaca - Tratamento", specialty: "Cardiologia" },
  // Semana 10
  { week: 10, topic: "Distúrbios Respiratórios Neonatais", specialty: "Pediatria" },
  { week: 10, topic: "Colecistite e Colangite", specialty: "Cirurgia" },
  { week: 10, topic: "Síndrome Febril Íctero-Hemorrágica", specialty: "Infectologia" },
  { week: 10, topic: "Complicações Crônicas do Diabetes", specialty: "Endocrinologia" },
  { week: 10, topic: "Gastrites e Dispepsia", specialty: "Gastroenterologia" },
  // Semana 11
  { week: 11, topic: "Distúrbios Metabólicos Neonatais", specialty: "Pediatria" },
  { week: 11, topic: "Diverticulite Aguda", specialty: "Cirurgia" },
  { week: 11, topic: "Atenção Primária à Saúde", specialty: "Medicina Preventiva" },
  { week: 11, topic: "Dor Pélvica Crônica e Dismenorreia", specialty: "Ginecologia e Obstetrícia" },
  { week: 11, topic: "Assistência ao Parto", specialty: "Ginecologia e Obstetrícia" },
  { week: 11, topic: "Insuficiência Cardíaca Aguda", specialty: "Cardiologia" },
  // Semana 12
  { week: 12, topic: "Infecções Congênitas", specialty: "Pediatria" },
  { week: 12, topic: "Abdome Agudo Perfurativo", specialty: "Cirurgia" },
  { week: 12, topic: "Abdome Agudo em Ginecologia", specialty: "Ginecologia e Obstetrícia" },
  { week: 12, topic: "Neutropenia Febril e FOI", specialty: "Infectologia" },
  { week: 12, topic: "Hiperglicemia Hospitalar", specialty: "Endocrinologia" },
  { week: 12, topic: "Lesão Renal Aguda", specialty: "Nefrologia" },
  // Semana 13
  { week: 13, topic: "Icterícia e Sepse Neonatal", specialty: "Pediatria" },
  { week: 13, topic: "Abdome Agudo Obstrutivo", specialty: "Cirurgia" },
  { week: 13, topic: "Políticas de Saúde", specialty: "Medicina Preventiva" },
  { week: 13, topic: "Parto Vaginal Operatório", specialty: "Ginecologia e Obstetrícia" },
  { week: 13, topic: "Dislipidemia e Risco Cardiovascular", specialty: "Cardiologia" },
  { week: 13, topic: "Cefaleias", specialty: "Neurologia" },
  // Semana 14
  { week: 14, topic: "Síndromes Genéticas e Erros Inatos", specialty: "Pediatria" },
  { week: 14, topic: "Abdome Agudo Vascular", specialty: "Cirurgia" },
  { week: 14, topic: "Avaliação Pré-Operatória Clínica", specialty: "Clínica Médica" },
  // Semana 15
  { week: 15, topic: "Pneumonias na Infância", specialty: "Pediatria" },
  { week: 15, topic: "Abdome Agudo Hemorrágico", specialty: "Cirurgia" },
  { week: 15, topic: "Medicina de Família e Comunidade", specialty: "Medicina Preventiva" },
  { week: 15, topic: "Violência Sexual", specialty: "Ginecologia e Obstetrícia" },
  { week: 15, topic: "HIV", specialty: "Infectologia" },
  { week: 15, topic: "Úlcera Péptica e H. pylori", specialty: "Gastroenterologia" },
  { week: 15, topic: "Indução do Parto", specialty: "Ginecologia e Obstetrícia" },
  { week: 15, topic: "Doença Coronariana Estável", specialty: "Cardiologia" },
  // Semana 16
  { week: 16, topic: "Bronquiolite", specialty: "Pediatria" },
  { week: 16, topic: "Medicina Perioperatória", specialty: "Cirurgia" },
  { week: 16, topic: "Sangramento Uterino Anormal", specialty: "Ginecologia e Obstetrícia" },
  { week: 16, topic: "Derrame Pleural", specialty: "Pneumologia" },
  { week: 16, topic: "Endocardite Infecciosa", specialty: "Cardiologia" },
  { week: 16, topic: "Tireoide - Avaliação Diagnóstica", specialty: "Endocrinologia" },
  { week: 16, topic: "ITU", specialty: "Infectologia" },
  // Semana 17
  { week: 17, topic: "Coqueluche", specialty: "Pediatria" },
  { week: 17, topic: "Resposta Endócrino-Metabólica ao Trauma", specialty: "Cirurgia" },
  { week: 17, topic: "Saúde do Idoso", specialty: "Medicina Preventiva" },
  { week: 17, topic: "Amenorreia", specialty: "Ginecologia e Obstetrícia" },
  { week: 17, topic: "Hemorragia Pós-Parto", specialty: "Ginecologia e Obstetrícia" },
  { week: 17, topic: "SCASSST", specialty: "Cardiologia" },
  // Semana 18
  { week: 18, topic: "Asma na Infância", specialty: "Pediatria" },
  { week: 18, topic: "Nutrição em Cirurgia", specialty: "Cirurgia" },
  { week: 18, topic: "Arboviroses", specialty: "Infectologia" },
  { week: 18, topic: "Hipotireoidismo", specialty: "Endocrinologia" },
  { week: 18, topic: "Neoplasias Pancreáticas", specialty: "Gastroenterologia" },
  { week: 18, topic: "Demências", specialty: "Neurologia" },
  // Semana 19
  { week: 19, topic: "Fibrose Cística", specialty: "Pediatria" },
  { week: 19, topic: "Complicações Pós-Operatórias", specialty: "Cirurgia" },
  { week: 19, topic: "Ética Médica", specialty: "Medicina Preventiva" },
  { week: 19, topic: "Síndrome dos Ovários Policísticos", specialty: "Ginecologia e Obstetrícia" },
  // Semana 20
  { week: 20, topic: "Doenças Exantemáticas", specialty: "Pediatria" },
  { week: 20, topic: "Cicatrização de Feridas", specialty: "Cirurgia" },
  { week: 20, topic: "Pneumonias Bacterianas", specialty: "Pneumologia" },
  { week: 20, topic: "Tireotoxicose", specialty: "Endocrinologia" },
  { week: 20, topic: "Distúrbios Ácido-Básicos", specialty: "Nefrologia" },
  { week: 20, topic: "DPOC", specialty: "Pneumologia" },
  { week: 20, topic: "Infecção Puerperal", specialty: "Ginecologia e Obstetrícia" },
  { week: 20, topic: "IAM com Supra de ST", specialty: "Cardiologia" },
  // Semana 21
  { week: 21, topic: "Tuberculose na Infância", specialty: "Pediatria" },
  { week: 21, topic: "Hérnias da Parede Abdominal", specialty: "Cirurgia" },
  { week: 21, topic: "Processo Saúde-Doença", specialty: "Medicina Preventiva" },
  { week: 21, topic: "Planejamento Familiar", specialty: "Ginecologia e Obstetrícia" },
  { week: 21, topic: "Sangramento da Primeira Metade", specialty: "Ginecologia e Obstetrícia" },
  { week: 21, topic: "Semiologia Cardíaca", specialty: "Cardiologia" },
  // Semana 22
  { week: 22, topic: "Febre na Pediatria", specialty: "Pediatria" },
  { week: 22, topic: "Cirurgia Bariátrica", specialty: "Cirurgia" },
  { week: 22, topic: "Climatério e Terapia Hormonal", specialty: "Ginecologia e Obstetrícia" },
  { week: 22, topic: "Animais Peçonhentos", specialty: "Infectologia" },
  { week: 22, topic: "Obesidade e Síndrome Metabólica", specialty: "Endocrinologia" },
  { week: 22, topic: "Pancreatite Aguda e Crônica", specialty: "Gastroenterologia" },
  // Semana 23
  { week: 23, topic: "Cardiopatias Congênitas", specialty: "Pediatria" },
  { week: 23, topic: "Vesícula e Vias Biliares", specialty: "Cirurgia" },
  { week: 23, topic: "Indicadores de Morbidade", specialty: "Medicina Preventiva" },
  { week: 23, topic: "Sangramento da Segunda Metade", specialty: "Ginecologia e Obstetrícia" },
  { week: 23, topic: "Fibrilação e Flutter Atrial", specialty: "Cardiologia" },
  { week: 23, topic: "Epilepsias", specialty: "Neurologia" },
  // Semana 24
  { week: 24, topic: "Diarreia Aguda", specialty: "Pediatria" },
  { week: 24, topic: "Perioperatório - Controle Glicêmico", specialty: "Cirurgia" },
  { week: 24, topic: "Taquiarritmias", specialty: "Cardiologia" },
  { week: 24, topic: "Princípios de Oncologia e Estadiamento TNM", specialty: "Oncologia" },
  { week: 24, topic: "Dor Crônica e Cuidados Paliativos", specialty: "Clínica Médica" },
  // Semana 25
  { week: 25, topic: "DRGE em Pediatria", specialty: "Pediatria" },
  { week: 25, topic: "Cirurgia Infantil - Parte I", specialty: "Cirurgia" },
  // Semana 26
  { week: 26, topic: "ITU em Pediatria", specialty: "Pediatria" },
  { week: 26, topic: "Cirurgia Infantil - Parte II", specialty: "Cirurgia" },
  { week: 26, topic: "Síndrome Pré-Menstrual", specialty: "Ginecologia e Obstetrícia" },
  { week: 26, topic: "Micoses Invasivas", specialty: "Infectologia" },
  { week: 26, topic: "Hipocalcemia", specialty: "Endocrinologia" },
  { week: 26, topic: "Síndrome do Intestino Irritável", specialty: "Gastroenterologia" },
  // Semana 27
  { week: 27, topic: "Doença de Kawasaki", specialty: "Pediatria" },
  { week: 27, topic: "Cirurgia Infantil - Parte III", specialty: "Cirurgia" },
  { week: 27, topic: "Indicadores Demográficos", specialty: "Medicina Preventiva" },
  { week: 27, topic: "Cervicites", specialty: "Ginecologia e Obstetrícia" },
  { week: 27, topic: "Rotura Prematura de Membranas", specialty: "Ginecologia e Obstetrícia" },
  { week: 27, topic: "Bradiarritmias", specialty: "Cardiologia" },
  // Semana 28
  { week: 28, topic: "Febre Reumática", specialty: "Pediatria" },
  { week: 28, topic: "Cirurgia Vascular", specialty: "Cirurgia" },
  { week: 28, topic: "Meningites", specialty: "Infectologia" },
  { week: 28, topic: "Osteoporose", specialty: "Endocrinologia" },
  // Semana 29
  { week: 29, topic: "Doenças Glomerulares", specialty: "Nefrologia" },
  { week: 29, topic: "AVC", specialty: "Neurologia" },
  // Semana 30
  { week: 30, topic: "Emergências Pediátricas", specialty: "Pediatria" },
  { week: 30, topic: "Urologia", specialty: "Cirurgia" },
  { week: 30, topic: "Processos Epidêmicos", specialty: "Medicina Preventiva" },
  { week: 30, topic: "Doença Inflamatória Pélvica", specialty: "Ginecologia e Obstetrícia" },
  { week: 30, topic: "Abortamento de Repetição", specialty: "Ginecologia e Obstetrícia" },
  { week: 30, topic: "Parada Cardiorrespiratória", specialty: "Cardiologia" },
  // Semana 31
  { week: 31, topic: "Choque em Pediatria", specialty: "Pediatria" },
  { week: 31, topic: "Cirurgia Plástica", specialty: "Cirurgia" },
  { week: 31, topic: "Hepatoesplenomegalias Infecciosas", specialty: "Infectologia" },
  { week: 31, topic: "Insuficiência Adrenal", specialty: "Endocrinologia" },
  { week: 31, topic: "Distúrbios Disabsortivos", specialty: "Gastroenterologia" },
  { week: 31, topic: "Pneumologia Intensiva", specialty: "Pneumologia" },
  // Semana 32
  { week: 32, topic: "Convulsão Febril", specialty: "Pediatria" },
  { week: 32, topic: "Cirurgia Torácica", specialty: "Cirurgia" },
  { week: 32, topic: "Vigilância em Saúde", specialty: "Medicina Preventiva" },
  { week: 32, topic: "Úlceras Genitais", specialty: "Ginecologia e Obstetrícia" },
  { week: 32, topic: "Gestação Múltipla", specialty: "Ginecologia e Obstetrícia" },
  { week: 32, topic: "Síncope", specialty: "Cardiologia" },
  // Semana 33
  { week: 33, topic: "Anafilaxia e Urticária", specialty: "Medicina de Emergência" },
  { week: 33, topic: "Temas Gerais em Cirurgia", specialty: "Cirurgia" },
  { week: 33, topic: "Vulvovaginites", specialty: "Ginecologia e Obstetrícia" },
  { week: 33, topic: "Influenza", specialty: "Infectologia" },
  { week: 33, topic: "Síndrome de Cushing", specialty: "Endocrinologia" },
  { week: 33, topic: "Nefrolitíase", specialty: "Nefrologia" },
  // Semana 34
  { week: 34, topic: "Hiperplasia Adrenal Congênita", specialty: "Pediatria" },
  { week: 34, topic: "Sistemas de Informação em Saúde", specialty: "Medicina Preventiva" },
  { week: 34, topic: "Síndromes Hipertensivas da Gestação", specialty: "Ginecologia e Obstetrícia" },
  { week: 34, topic: "Eletrocardiograma", specialty: "Cardiologia" },
  { week: 34, topic: "Doenças Neuromusculares", specialty: "Neurologia" },
  { week: 34, topic: "Artrite Reumatoide", specialty: "Reumatologia" },
  { week: 34, topic: "Alergia Alimentar", specialty: "Pediatria" },
  { week: 34, topic: "Rastreamento Câncer de Colo Uterino", specialty: "Ginecologia e Obstetrícia" },
  { week: 34, topic: "Parasitoses", specialty: "Infectologia" },
  { week: 34, topic: "Feocromocitoma e Hiperaldosteronismo", specialty: "Endocrinologia" },
  { week: 34, topic: "Doença Inflamatória Intestinal", specialty: "Gastroenterologia" },
  { week: 34, topic: "Introdução às Anemias", specialty: "Hematologia" },
  // Semana 35
  { week: 35, topic: "Obesidade Infantil", specialty: "Pediatria" },
  { week: 35, topic: "Pesquisa Epidemiológica", specialty: "Medicina Preventiva" },
  { week: 35, topic: "Diabetes Gestacional", specialty: "Ginecologia e Obstetrícia" },
  { week: 35, topic: "Síndromes Aórticas Agudas", specialty: "Cardiologia" },
  { week: 35, topic: "Asma", specialty: "Pneumologia" },
  { week: 35, topic: "Espondiloartrites", specialty: "Reumatologia" },
  // Semana 36
  { week: 36, topic: "Constipação Intestinal", specialty: "Pediatria" },
  { week: 36, topic: "Câncer de Colo Uterino", specialty: "Ginecologia e Obstetrícia" },
  { week: 36, topic: "COVID-19", specialty: "Infectologia" },
  { week: 36, topic: "Hiperprolactinemia", specialty: "Endocrinologia" },
  { week: 36, topic: "Distúrbios do Potássio", specialty: "Nefrologia" },
  { week: 36, topic: "Anemias Microcíticas", specialty: "Hematologia" },
  // Semana 37
  { week: 37, topic: "Desnutrição na Infância", specialty: "Pediatria" },
  { week: 37, topic: "Testes Diagnósticos", specialty: "Medicina Preventiva" },
  { week: 37, topic: "Tumores Anexiais e Câncer de Ovário", specialty: "Ginecologia e Obstetrícia" },
  { week: 37, topic: "Sífilis na Gestação", specialty: "Ginecologia e Obstetrícia" },
  { week: 37, topic: "Choque", specialty: "Medicina de Emergência" },
  { week: 37, topic: "Distúrbios do Movimento", specialty: "Neurologia" },
  // Semana 38
  { week: 38, topic: "Hipertensão na Criança", specialty: "Pediatria" },
  { week: 38, topic: "Infecções Hospitalares", specialty: "Cirurgia" },
  { week: 38, topic: "Neoplasias Endócrinas Múltiplas", specialty: "Endocrinologia" },
  { week: 38, topic: "Hemorragia Digestiva Alta Varicosa", specialty: "Gastroenterologia" },
  { week: 38, topic: "Artrites Microcristalinas", specialty: "Reumatologia" },
  { week: 38, topic: "Anemias Macrocíticas", specialty: "Hematologia" },
  // Semana 39
  { week: 39, topic: "Púrpura de Henoch-Schönlein", specialty: "Pediatria" },
  { week: 39, topic: "Estatística Médica", specialty: "Medicina Preventiva" },
  { week: 39, topic: "Doenças de Vulva e Vagina", specialty: "Ginecologia e Obstetrícia" },
  { week: 39, topic: "Ultrassom em Obstetrícia", specialty: "Ginecologia e Obstetrícia" },
  { week: 39, topic: "Cardiomiopatias", specialty: "Cardiologia" },
  { week: 39, topic: "Dependência Química", specialty: "Psiquiatria" },
  // Semana 40
  { week: 40, topic: "Artrite Idiopática Juvenil", specialty: "Pediatria" },
  { week: 40, topic: "Raiva e Tétano", specialty: "Infectologia" },
  { week: 40, topic: "Distúrbios do Sódio", specialty: "Nefrologia" },
  { week: 40, topic: "Neoplasias Pulmonares", specialty: "Pneumologia" },
  { week: 40, topic: "Artropatias Infecciosas", specialty: "Reumatologia" },
  { week: 40, topic: "Anemias Hemolíticas", specialty: "Hematologia" },
  // Semana 41
  { week: 41, topic: "Tópicos em Pediatria", specialty: "Pediatria" },
  { week: 41, topic: "Saúde do Trabalhador", specialty: "Medicina Preventiva" },
  { week: 41, topic: "Câncer do Corpo do Útero", specialty: "Ginecologia e Obstetrícia" },
  { week: 41, topic: "Vitalidade Fetal", specialty: "Ginecologia e Obstetrícia" },
  { week: 41, topic: "TCE", specialty: "Cirurgia" },
  { week: 41, topic: "Lesões Elementares da Pele", specialty: "Dermatologia" },
  // Semana 42
  { week: 42, topic: "Doenças Benignas da Mama", specialty: "Ginecologia e Obstetrícia" },
  { week: 42, topic: "Sífilis e ISTs", specialty: "Infectologia" },
  { week: 42, topic: "Hemorragia Digestiva Alta Não Varicosa", specialty: "Gastroenterologia" },
  { week: 42, topic: "Vasculites", specialty: "Reumatologia" },
  { week: 42, topic: "Anemias Associadas", specialty: "Hematologia" },
  { week: 42, topic: "Transtornos do Humor", specialty: "Psiquiatria" },
  { week: 42, topic: "Dermatoses Infecciosas", specialty: "Dermatologia" },
  // Semana 43
  { week: 43, topic: "Doenças Autoimunes do Tecido Conjuntivo", specialty: "Reumatologia" },
  { week: 43, topic: "Hemostasia e Anticoagulantes", specialty: "Hematologia" },
  { week: 43, topic: "Transtornos de Ansiedade", specialty: "Psiquiatria" },
  { week: 43, topic: "Introdução à Hepatologia", specialty: "Gastroenterologia" },
  { week: 43, topic: "Hanseníase", specialty: "Dermatologia" },
  { week: 43, topic: "Doenças da Coluna Vertebral", specialty: "Ortopedia" },
  { week: 43, topic: "IVAS", specialty: "Otorrinolaringologia" },
  // Semana 44
  { week: 44, topic: "Rastreamento Câncer de Mama", specialty: "Ginecologia e Obstetrícia" },
  { week: 44, topic: "Túbulo-Interstício Renal", specialty: "Nefrologia" },
  { week: 44, topic: "Doenças Autoimunes - Parte 2", specialty: "Reumatologia" },
  { week: 44, topic: "Doenças Hemostáticas", specialty: "Hematologia" },
  { week: 44, topic: "Transtornos Psicóticos", specialty: "Psiquiatria" },
  { week: 44, topic: "Hepatites Virais", specialty: "Gastroenterologia" },
  { week: 44, topic: "Câncer de Pele", specialty: "Dermatologia" },
  // Semana 45
  { week: 45, topic: "Distúrbios do Sono", specialty: "Psiquiatria" },
  { week: 45, topic: "Doenças do Osso e da Cartilagem", specialty: "Ortopedia" },
  { week: 45, topic: "Leucemias Agudas", specialty: "Hematologia" },
  { week: 45, topic: "Intoxicações Exógenas", specialty: "Medicina de Emergência" },
  { week: 45, topic: "Dermatoses Eczematosas", specialty: "Dermatologia" },
  { week: 45, topic: "Síndromes Compressivas", specialty: "Ortopedia" },
  { week: 45, topic: "IVAS - Parte III", specialty: "Otorrinolaringologia" },
  { week: 45, topic: "Síndrome do Olho Vermelho", specialty: "Oftalmologia" },
  // Semana 46
  { week: 46, topic: "Incontinência Urinária", specialty: "Ginecologia e Obstetrícia" },
  { week: 46, topic: "Hemorragia Digestiva Baixa", specialty: "Gastroenterologia" },
  { week: 46, topic: "Síndromes Dolorosas Crônicas", specialty: "Reumatologia" },
  { week: 46, topic: "Leucemias Crônicas e Linfomas", specialty: "Hematologia" },
  { week: 46, topic: "Psiquiatria Infantil", specialty: "Psiquiatria" },
  { week: 46, topic: "Cirrose Hepática", specialty: "Gastroenterologia" },
  { week: 46, topic: "Farmacodermias", specialty: "Dermatologia" },
  { week: 46, topic: "Osteomielite", specialty: "Ortopedia" },
  { week: 46, topic: "Otoneurologia e Vertigens", specialty: "Otorrinolaringologia" },
  { week: 46, topic: "Córnea e Cristalino", specialty: "Oftalmologia" },
  // Semana 47
  { week: 47, topic: "Prolapso de Órgãos Pélvicos", specialty: "Ginecologia e Obstetrícia" },
  { week: 47, topic: "Infecções Congênitas na Gestação", specialty: "Ginecologia e Obstetrícia" },
  { week: 47, topic: "Neoplasias de Estômago e Esôfago", specialty: "Gastroenterologia" },
  { week: 47, topic: "Mieloma Múltiplo", specialty: "Hematologia" },
  { week: 47, topic: "Transtornos Alimentares", specialty: "Psiquiatria" },
  { week: 47, topic: "Dermatoses Papuloescamosas", specialty: "Dermatologia" },
  { week: 47, topic: "Quadril Pediátrico", specialty: "Ortopedia" },
  { week: 47, topic: "Cirurgia de Cabeça e Pescoço", specialty: "Otorrinolaringologia" },
  // Semana 48
  { week: 48, topic: "Polipose e Câncer Colorretal", specialty: "Gastroenterologia" },
  { week: 48, topic: "Medicina Transfusional", specialty: "Hematologia" },
  { week: 48, topic: "Transtornos de Personalidade", specialty: "Psiquiatria" },
  { week: 48, topic: "Hepatopatia Crônica", specialty: "Gastroenterologia" },
  { week: 48, topic: "Dermatoses Vesicobolhosas", specialty: "Dermatologia" },
  { week: 48, topic: "Desenvolvimento Ortopédico da Criança", specialty: "Ortopedia" },
  { week: 48, topic: "Câncer de Tireoide", specialty: "Otorrinolaringologia" },
  { week: 48, topic: "Maus Tratos", specialty: "Pediatria" },
  { week: 48, topic: "Glaucoma", specialty: "Oftalmologia" },
  // Semana 49
  { week: 49, topic: "Aloimunização Materna", specialty: "Ginecologia e Obstetrícia" },
  { week: 49, topic: "Doenças Desmielinizantes", specialty: "Neurologia" },
  { week: 49, topic: "Psicofarmacologia", specialty: "Psiquiatria" },
  { week: 49, topic: "Hepatopatias Autoimunes", specialty: "Gastroenterologia" },
  { week: 49, topic: "TOC e Transtornos Somáticos", specialty: "Psiquiatria" },
  { week: 49, topic: "Complicações da Cirrose", specialty: "Gastroenterologia" },
  { week: 49, topic: "Síndromes Verrucosas", specialty: "Dermatologia" },
  { week: 49, topic: "Trauma Ortopédico", specialty: "Ortopedia" },
  { week: 49, topic: "Neoplasias de Cabeça e Pescoço", specialty: "Otorrinolaringologia" },
  { week: 49, topic: "Fratura Exposta", specialty: "Ortopedia" },
  // Semana 50
  { week: 50, topic: "Psicopatologia", specialty: "Psiquiatria" },
  { week: 50, topic: "Síndrome Hepatorrenal", specialty: "Gastroenterologia" },
  { week: 50, topic: "Piodermites", specialty: "Dermatologia" },
  { week: 50, topic: "Complicações do Trauma Ortopédico", specialty: "Ortopedia" },
  { week: 50, topic: "Reforma Psiquiátrica", specialty: "Psiquiatria" },
  { week: 50, topic: "Tumores Hepáticos", specialty: "Gastroenterologia" },
  { week: 50, topic: "Fraturas e Luxações", specialty: "Ortopedia" },
  { week: 50, topic: "Distúrbios da Refração", specialty: "Oftalmologia" },
  { week: 50, topic: "Politrauma Ortopédico", specialty: "Ortopedia" },
];

/** Get unique specialties covered in the curriculum */
export function getCurriculumSpecialties(): string[] {
  return [...new Set(BASE_CURRICULUM.map(t => t.specialty))];
}

/** Get all unique topic names */
export function getCurriculumTopics(): string[] {
  return [...new Set(BASE_CURRICULUM.map(t => t.topic))];
}

/** Get topics grouped by specialty */
export function getCurriculumBySpecialty(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of BASE_CURRICULUM) {
    if (!map[t.specialty]) map[t.specialty] = [];
    if (!map[t.specialty].includes(t.topic)) map[t.specialty].push(t.topic);
  }
  return map;
}

/** Check if a topic/specialty matches curriculum content (fuzzy) */
export function isInCurriculum(topic: string, specialty?: string): boolean {
  const lower = topic.toLowerCase();
  return BASE_CURRICULUM.some(c => {
    const topicMatch = c.topic.toLowerCase().includes(lower) || lower.includes(c.topic.toLowerCase());
    if (specialty) {
      return topicMatch && c.specialty.toLowerCase().includes(specialty.toLowerCase());
    }
    return topicMatch;
  });
}

/** Total unique topics in curriculum */
export const CURRICULUM_TOTAL_TOPICS = getCurriculumTopics().length;
export const CURRICULUM_TOTAL_WEEKS = 50;
