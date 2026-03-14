DELETE FROM public.practice_attempts 
WHERE question_id IN (
  'cd8f4173-0c39-4b11-a793-b808442e7c13',
  '6ec06ba4-d542-490f-9d64-7a700b8813e1',
  '45a8cdab-ee9b-4f6e-9046-52872025f74c'
);

DELETE FROM public.questions_bank 
WHERE id IN (
  'cd8f4173-0c39-4b11-a793-b808442e7c13',
  '6ec06ba4-d542-490f-9d64-7a700b8813e1',
  '45a8cdab-ee9b-4f6e-9046-52872025f74c'
);

DELETE FROM public.flashcards 
WHERE topic ILIKE '%direito%' 
   OR topic ILIKE '%penal%' 
   OR topic ILIKE '%legisla%' 
   OR topic ILIKE '%jurídic%' 
   OR topic ILIKE '%constitucional%' 
   OR topic ILIKE '%processo penal%' 
   OR topic ILIKE '%sumular%' 
   OR topic ILIKE '%policia%' 
   OR topic ILIKE '%polícia%' 
   OR topic ILIKE '%estatuto da pf%' 
   OR topic ILIKE '%segurança pública%' 
   OR topic ILIKE '%investigação criminal%' 
   OR topic ILIKE '%ação penal%' 
   OR topic ILIKE '%autoridade policial%';