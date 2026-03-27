import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi: string;
  url: string;
}

async function searchPubMed(query: string, maxResults = 5): Promise<PubMedArticle[]> {
  const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
  
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
  
  // Step 3: Fetch abstracts
  const fetchUrl = `${BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`;
  const fetchRes = await fetch(fetchUrl);
  const xmlText = await fetchRes.text();
  
  // Parse abstracts from XML (simple regex extraction)
  const abstractMap: Record<string, string> = {};
  const articleBlocks = xmlText.split("<PubmedArticle>");
  for (const block of articleBlocks) {
    const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const abstractMatch = block.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g);
    if (pmidMatch && abstractMatch) {
      const cleanAbstract = abstractMatch
        .map(a => a.replace(/<[^>]+>/g, "").trim())
        .join(" ")
        .slice(0, 500);
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
  
  return articles;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, maxResults } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query é obrigatória (mín. 2 caracteres)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add medical/residency context to the query for better results
    const medicalQuery = `${query.trim()} AND (review[pt] OR clinical trial[pt] OR guideline[pt])`;
    
    console.log("PubMed search:", medicalQuery);
    const articles = await searchPubMed(medicalQuery, maxResults || 5);
    
    // If no results with filter, try without
    let finalArticles = articles;
    if (articles.length === 0) {
      console.log("No results with filter, retrying without...");
      finalArticles = await searchPubMed(query.trim(), maxResults || 5);
    }

    console.log(`Found ${finalArticles.length} articles`);
    return new Response(
      JSON.stringify({ success: true, articles: finalArticles, total: finalArticles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("PubMed search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro na busca PubMed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
