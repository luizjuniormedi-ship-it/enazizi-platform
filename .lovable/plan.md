

# Aprofundar Explicações Técnicas do Tutor IA

## Análise do Método Atual

O prompt atual (`enazizi-prompt.ts`, 941 linhas) já é robusto, mas tem lacunas na profundidade técnica:

### O que já existe (bom):
- Fisiopatologia com mediadores moleculares (IL-6, TNF-α, cascata RAAS)
- Correlação sintoma ↔ mecanismo
- Tabelas de eventos adversos com mecanismo
- Manobras diagnósticas com sensibilidade/especificidade
- MBE com níveis de evidência
- Referências bibliográficas e PubMed

### O que falta (lacunas identificadas):

1. **Epidemiologia e dados numéricos** — Não exige incidência, prevalência, mortalidade ou NNT (Number Needed to Treat). Provas de residência cobram esses números.

2. **Exames complementares detalhados** — O prompt menciona "exame confirmatório" mas não exige padrões de imagem (ex: sinal do halo no TC de aspergilose), valores de referência laboratorial, ou critérios diagnósticos formais (ex: Critérios de Duke, SIRS, qSOFA).

3. **Estadiamento e classificações** — Não obriga classificações (NYHA para IC, Child-Pugh para cirrose, GOLD para DPOC, TNM para câncer). Estas são altamente cobradas em provas.

4. **Fluxogramas de conduta** — O prompt não pede algoritmos decisórios (ex: "Se X → faça Y; se Z → faça W"). Provas cobram fluxos de decisão.

5. **Comparação farmacológica estruturada** — Embora exija eventos adversos, não obriga comparação entre drogas da mesma classe (ex: enalapril vs losartana, metformina vs glicazida) com vantagens, desvantagens e indicações preferenciais.

6. **Populações especiais** — Não exige adaptações para gestantes, idosos, crianças, nefropatas e hepatopatas — pontos clássicos de pegadinha.

7. **Emergência e urgência** — Falta seção obrigatória de "sinais de alarme" e "quando internar/encaminhar".

## Mudanças no `enazizi-prompt.ts`

Adicionar 6 novas seções obrigatórias ao prompt, inseridas nos pontos estratégicos:

### 1. Seção EPIDEMIOLOGIA (após fisiopatologia)
```
📊 EPIDEMIOLOGIA E NÚMEROS-CHAVE
- Incidência/prevalência (Brasil e mundial)
- Mortalidade / letalidade
- Faixa etária e sexo mais acometidos
- Fatores de risco com Odds Ratio ou Risco Relativo quando disponível
```

### 2. Seção CRITÉRIOS DIAGNÓSTICOS (após exame físico)
```
📋 CRITÉRIOS DIAGNÓSTICOS E CLASSIFICAÇÕES
- Critérios formais (ex: Jones, Duke, SIRS, qSOFA, Wells)
- Classificação/estadiamento (NYHA, Child-Pugh, GOLD, TNM, Fisher)
- Valores de referência laboratorial relevantes
- Padrões de imagem patognomônicos (ex: "vidro fosco", "sinal do halo")
```

### 3. Seção COMPARAÇÃO FARMACOLÓGICA (após eventos adversos)
```
💊 COMPARAÇÃO ENTRE DROGAS DA MESMA CLASSE
| Droga | Vantagem | Desvantagem | Indicação preferencial |
Ex: IECA vs BRA, metformina vs sulfonilureia, heparina vs enoxaparina
```

### 4. Seção POPULAÇÕES ESPECIAIS (após conduta)
```
👶🤰👴 POPULAÇÕES ESPECIAIS
- Gestante: o que muda na conduta? Droga contraindicada?
- Idoso: ajuste de dose? Risco de polifarmácia?
- Criança: dose pediátrica? Peculiaridades?
- Nefropata/hepatopata: ajuste? Droga evitada?
```

### 5. Seção SINAIS DE ALARME (após aplicação clínica)
```
🚨 SINAIS DE ALARME — QUANDO INTERNAR
- Lista de red flags que indicam gravidade
- Critérios de internação vs ambulatorial
- Quando encaminhar ao especialista
```

### 6. Seção FLUXOGRAMA DECISÓRIO (após conduta)
```
🔄 FLUXOGRAMA DE CONDUTA
Apresentar decisão em formato:
Se [condição A] → [conduta 1]
Se [condição B] → [conduta 2]
Se [complicação] → [escalar para]
```

### 7. Atualizar a SEQUÊNCIA DE ENTREGA

Reorganizar as 4 mensagens do bloco atômico para incluir as novas seções:

- **Mensagem 1**: Caso gatilho + Explicação leigo + Fisiopatologia + **Epidemiologia**
- **Mensagem 2**: Explicação técnica + Exame físico + **Critérios diagnósticos** + Aplicação clínica + **Sinais de alarme**
- **Mensagem 3**: Conduta + **Fluxograma** + Eventos adversos + **Comparação farmacológica** + **Populações especiais** + Diferenciais
- **Mensagem 4**: Pegadinhas + Mnemônico + Resumo + Referências + Artigos + Pergunta

### 8. Aumentar limites de palavras

As mensagens 2 e 3 passam de 600-700 para **800 palavras** para acomodar o conteúdo extra sem cortar.

### 9. Atualizar checklist de verificação pré-resposta

Adicionar aos itens obrigatórios:
- Epidemiologia com dados numéricos incluída
- Critérios diagnósticos / classificação citados
- Populações especiais mencionadas (quando aplicável)
- Sinais de alarme listados

## Arquivos alterados

- `supabase/functions/_shared/enazizi-prompt.ts` — Adicionar as 6 novas seções + atualizar sequência de entrega + checklist

## Resultado

Cada explicação técnica passará de ~2.500 palavras totais para ~3.500 palavras (distribuídas em 4 mensagens), com cobertura completa de todos os pontos cobrados em provas de residência, sem perder a estrutura visual organizada.

