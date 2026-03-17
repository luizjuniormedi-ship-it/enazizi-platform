

# Remover Preços da Seção de Planos — Mostrar Apenas Benefícios

## Alteração: `src/components/landing/PricingSection.tsx`

1. **Remover campos `price` e `period`** dos objetos de planos
2. **Remover o bloco de preço** (linhas 61-64) do JSX — o `div` com `text-4xl font-black`
3. **Atualizar título da seção** para algo como "Conheça nossos planos" em vez de "Planos que cabem no seu bolso"
4. **Manter 4 planos** (Free, Pro, Premium, Enterprise) com benefícios reais baseados nas cotas de IA:
   - **Free**: Cronograma básico, 50 questões IA/mês, Flashcards limitados, Mentor IA básico
   - **Pro** : Upload ilimitado, 2.000 questões IA/mês, Simulados personalizados, Mentor IA completo, Revisão espaçada, Analytics
   - **Premium** (popular): Tudo do Pro + 8.000 questões IA/mês, Simulação clínica, Geração avançada de conteúdo, Preditor de desempenho, Suporte prioritário
   - **Enterprise**: Tudo do Premium + Questões ilimitadas, Painel Admin, Dashboard professor, Multiusuários, Analytics institucional
5. **Grid**: `lg:grid-cols-4`, `md:grid-cols-2` para acomodar 4 cards

1 arquivo alterado.

