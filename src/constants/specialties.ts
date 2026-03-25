export interface SpecialtyCycle {
  label: string;
  specialties: string[];
}

export const SPECIALTY_CYCLES: SpecialtyCycle[] = [
  {
    label: "Ciclo Básico (1º-2º ano)",
    specialties: [
      "Anatomia",
      "Bioquímica",
      "Embriologia",
      "Farmacologia",
      "Fisiologia",
      "Genética Médica",
      "Histologia",
      "Imunologia",
      "Microbiologia",
      "Parasitologia",
      "Patologia",
      "Semiologia",
    ],
  },
  {
    label: "Ciclo Clínico (3º-4º ano)",
    specialties: [
      "Angiologia",
      "Cardiologia",
      "Dermatologia",
      "Endocrinologia",
      "Gastroenterologia",
      "Hematologia",
      "Infectologia",
      "Nefrologia",
      "Neurologia",
      "Oftalmologia",
      "Oncologia",
      "Ortopedia",
      "Otorrinolaringologia",
      "Pneumologia",
      "Psiquiatria",
      "Reumatologia",
      "Urologia",
    ],
  },
  {
    label: "Internato (5º-6º ano)",
    specialties: [
      "Cirurgia",
      "Ginecologia e Obstetrícia",
      "Medicina de Emergência",
      "Medicina Preventiva",
      "Pediatria",
      "Terapia Intensiva",
    ],
  },
];

export const ALL_SPECIALTIES: string[] = SPECIALTY_CYCLES.flatMap(c => c.specialties);
