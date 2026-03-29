/**
 * Utilitário para busca no PubMed — Biblioteca Nacional de Medicina (NLM) / NIH.
 * Usa a API E-utilities do NCBI (gratuita, sem API key necessária).
 */

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi: string;
  url: string;
}

// In-memory cache with 10min TTL
const pubmedCache = new Map<string, { articles: PubMedArticle[]; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

export async function searchPubMed(query: string, maxResults = 3): Promise<PubMedArticle[]> {
  const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
  
  const cacheKey = `${query}::${maxResults}`;
  const cached = pubmedCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    console.log("[PubMed] Cache hit for:", query);
    return cached.articles;
  }
  
  try {
    // Step 1: Search for IDs
    const searchUrl = `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=relevance&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    const ids: string[] = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    // Step 2: Fetch summaries
    const summaryUrl = `${BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    // Step 3: Fetch abstracts via efetch XML
    const fetchUrl = `${BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`;
    const fetchRes = await fetch(fetchUrl);
    const xmlText = await fetchRes.text();

    // Parse abstracts from XML
    const abstractMap: Record<string, string> = {};
    const articleBlocks = xmlText.split("<PubmedArticle>");
    for (const block of articleBlocks) {
      const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const abstractMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
      if (pmidMatch && abstractMatch) {
        const cleanAbstract = abstractMatch
          .map(a => a.replace(/<[^>]+>/g, "").trim())
          .join(" ")
          .slice(0, 600);
        abstractMap[pmidMatch[1]] = cleanAbstract;
      }
    }
    
    const articles: PubMedArticle[] = [];
    const results = summaryData?.result || {};
    
    for (const id of ids) {
      const item = results[id];
      if (!item) continue;
      
      const authors = (item.authors || [])
        .slice(0, 3)
        .map((a: { name: string }) => a.name)
        .join(", ");
      
      const doi = (item.elocationid || "").replace("doi: ", "");
      
      articles.push({
        pmid: id,
        title: item.title || "",
        authors: authors + (item.authors?.length > 3 ? " et al." : ""),
        journal: item.fulljournalname || item.source || "",
        year: (item.pubdate || "").split(" ")[0] || "",
        abstract: abstractMap[id] || "",
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      });
    }
    
    // Store in cache
    pubmedCache.set(cacheKey, { articles, ts: Date.now() });
    // Evict old entries
    if (pubmedCache.size > 50) {
      const oldest = [...pubmedCache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
      if (oldest) pubmedCache.delete(oldest[0]);
    }
    return articles;
  } catch (e) {
    console.error("PubMed search error:", e);
    return [];
  }
}

/**
 * Formata artigos PubMed como bloco de texto para injeção em prompts de IA.
 * Inclui abstract resumido para que a IA possa usar como base.
 */
export function formatPubMedForPrompt(articles: PubMedArticle[]): string {
  if (articles.length === 0) return "";
  
  const lines = articles.map((a, i) => {
    let entry = `${i + 1}. "${a.title}" — ${a.authors} (${a.journal}, ${a.year})`;
    entry += `\n   Link: [Ver no PubMed](${a.url})`;
    if (a.doi) entry += ` | [DOI](https://doi.org/${a.doi})`;
    if (a.abstract) entry += `\n   Resumo: ${a.abstract}`;
    return entry;
  });
  
  return `\n\n--- ARTIGOS CIENTÍFICOS REAIS — Biblioteca Nacional de Medicina (NLM) | NIH ---\n${lines.join("\n\n")}\n--- FIM ARTIGOS NLM/PubMed ---`;
}

/**
 * Extrai o tema principal da última mensagem do usuário para busca PubMed.
 */
export function extractSearchTopic(messages: { role: string; content: string }[]): string {
  const userMsgs = messages.filter(m => m.role === "user");
  if (userMsgs.length === 0) return "";
  const lastMsg = userMsgs[userMsgs.length - 1].content;
  return lastMsg.replace(/[^\w\sÀ-ú]/g, "").trim().slice(0, 100);
}
