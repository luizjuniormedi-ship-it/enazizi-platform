/**
 * Utilitário para busca no PubMed (NLM/NIH) a partir de edge functions.
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

export async function searchPubMed(query: string, maxResults = 3): Promise<PubMedArticle[]> {
  const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
  
  try {
    const searchUrl = `${BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=relevance&retmode=json`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    const ids: string[] = searchData?.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const summaryUrl = `${BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    
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
        abstract: "",
        doi,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      });
    }
    
    return articles;
  } catch (e) {
    console.error("PubMed search error:", e);
    return [];
  }
}

/**
 * Formata artigos PubMed como bloco de texto para injeção em prompts de IA.
 */
export function formatPubMedForPrompt(articles: PubMedArticle[]): string {
  if (articles.length === 0) return "";
  
  const lines = articles.map((a, i) => 
    `${i + 1}. **${a.title}** — ${a.authors} (${a.journal}, ${a.year}) [PubMed](${a.url})${a.doi ? ` | DOI: ${a.doi}` : ""}`
  );
  
  return `\n\n--- ARTIGOS PUBMED/NLM ENCONTRADOS (use como referência na resposta) ---\n${lines.join("\n")}\n--- FIM ARTIGOS PUBMED ---`;
}

/**
 * Extrai o tema principal da última mensagem do usuário para busca PubMed.
 */
export function extractSearchTopic(messages: { role: string; content: string }[]): string {
  const userMsgs = messages.filter(m => m.role === "user");
  if (userMsgs.length === 0) return "";
  const lastMsg = userMsgs[userMsgs.length - 1].content;
  // Remove emojis and special chars, take first 100 chars
  return lastMsg.replace(/[^\w\sÀ-ú]/g, "").trim().slice(0, 100);
}
