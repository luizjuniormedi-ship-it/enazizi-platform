import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ===== PRIORITY SOURCES =====
interface SourceConfig {
  name: string;
  searchUrl: (query: string) => string;
  license: string;
  trusted: boolean;
  requiresCredential: boolean;
}

const PRIORITY_SOURCES: Record<string, SourceConfig[]> = {
  xray: [
    { name: "Open-i NIH", searchUrl: (q) => `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(q + " chest xray")}&m=1&n=5&it=xg`, license: "public_domain_nih", trusted: true, requiresCredential: false },
    { name: "Radiopaedia", searchUrl: (q) => `https://radiopaedia.org/search?utf8=%E2%9C%93&q=${encodeURIComponent(q)}&scope=cases`, license: "cc_by_nc_sa", trusted: true, requiresCredential: false },
  ],
  ct: [
    { name: "Open-i NIH", searchUrl: (q) => `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(q + " CT scan")}&m=1&n=5&it=xg`, license: "public_domain_nih", trusted: true, requiresCredential: false },
    { name: "Radiopaedia", searchUrl: (q) => `https://radiopaedia.org/search?utf8=%E2%9C%93&q=${encodeURIComponent(q + " CT")}&scope=cases`, license: "cc_by_nc_sa", trusted: true, requiresCredential: false },
  ],
  ecg: [
    { name: "LITFL ECG Library", searchUrl: (q) => `https://litfl.com/ecg-library/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, "-"))}/`, license: "cc_by_nc_sa", trusted: true, requiresCredential: false },
    { name: "ECGpedia", searchUrl: (q) => `https://en.ecgpedia.org/wiki/${encodeURIComponent(q.replace(/\s+/g, "_"))}`, license: "cc_by_nc_sa", trusted: true, requiresCredential: false },
  ],
  dermatology: [
    { name: "DermNet NZ", searchUrl: (q) => `https://dermnetnz.org/topics/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, "-"))}`, license: "cc_by_nc_nd", trusted: true, requiresCredential: false },
    { name: "Open-i NIH", searchUrl: (q) => `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(q + " dermatology clinical photo")}&m=1&n=5`, license: "public_domain_nih", trusted: true, requiresCredential: false },
  ],
  pathology: [
    { name: "PathologyOutlines", searchUrl: (q) => `https://www.pathologyoutlines.com/search?searchterm=${encodeURIComponent(q)}`, license: "educational_fair_use", trusted: true, requiresCredential: false },
    { name: "Open-i NIH", searchUrl: (q) => `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(q + " histopathology")}&m=1&n=5`, license: "public_domain_nih", trusted: true, requiresCredential: false },
  ],
  ophthalmology: [
    { name: "EyeWiki AAO", searchUrl: (q) => `https://eyewiki.aao.org/w/index.php?search=${encodeURIComponent(q)}`, license: "cc_by_nc_nd", trusted: true, requiresCredential: false },
    { name: "Open-i NIH", searchUrl: (q) => `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(q + " fundoscopy ophthalmology")}&m=1&n=5`, license: "public_domain_nih", trusted: true, requiresCredential: false },
  ],
  us: [
    { name: "Open-i NIH", searchUrl: (q) => `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(q + " ultrasound")}&m=1&n=5&it=xg`, license: "public_domain_nih", trusted: true, requiresCredential: false },
    { name: "Radiopaedia", searchUrl: (q) => `https://radiopaedia.org/search?utf8=%E2%9C%93&q=${encodeURIComponent(q + " ultrasound")}&scope=cases`, license: "cc_by_nc_sa", trusted: true, requiresCredential: false },
  ],
};

// ===== MODALITY SEARCH TERMS =====
const MODALITY_TERMS: Record<string, string> = {
  ecg: "ECG electrocardiogram",
  xray: "X-ray radiograph chest",
  ct: "CT computed tomography",
  us: "ultrasound sonography",
  dermatology: "dermatology clinical photo skin",
  pathology: "histopathology microscopy H&E",
  ophthalmology: "ophthalmology fundoscopy retina",
};

// ===== IMAGE EXTRACTION =====
function extractImageUrls(html: string): string[] {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const urls: string[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (
      src.startsWith("http") &&
      !src.includes("logo") &&
      !src.includes("icon") &&
      !src.includes("avatar") &&
      !src.includes("banner") &&
      !src.includes("favicon") &&
      !src.includes("tracking") &&
      !src.includes("ad-") &&
      !src.includes("pixel") &&
      !src.includes("analytics") &&
      (src.endsWith(".jpg") || src.endsWith(".jpeg") || src.endsWith(".png") || src.endsWith(".webp") || src.includes("/images/"))
    ) {
      urls.push(src);
    }
  }
  return urls;
}

// ===== OPEN-I NIH API SEARCH =====
async function searchOpenI(query: string): Promise<{ images: string[]; pageUrl: string }> {
  try {
    const apiUrl = `https://openi.nlm.nih.gov/api/search?query=${encodeURIComponent(query)}&m=1&n=5`;
    console.log(`[Open-i] Searching: ${apiUrl}`);
    const resp = await fetch(apiUrl, { headers: { "Accept": "application/json" } });
    if (!resp.ok) return { images: [], pageUrl: apiUrl };

    const data = await resp.json();
    const images: string[] = [];
    if (data?.list) {
      for (const item of data.list) {
        if (item.imgLarge) images.push(`https://openi.nlm.nih.gov${item.imgLarge}`);
        else if (item.imgThumb) images.push(`https://openi.nlm.nih.gov${item.imgThumb}`);
      }
    }
    return { images, pageUrl: apiUrl };
  } catch (err) {
    console.error("[Open-i] Error:", err);
    return { images: [], pageUrl: "" };
  }
}

// ===== FIRECRAWL SCRAPE =====
async function scrapeWithFirecrawl(url: string): Promise<{ images: string[]; sourceUrl: string }> {
  if (!FIRECRAWL_API_KEY) return { images: [], sourceUrl: url };

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["html", "links"], onlyMainContent: true, waitFor: 3000 }),
    });

    if (!response.ok) return { images: [], sourceUrl: url };
    const data = await response.json();
    const html = data?.data?.html || data?.html || "";
    return { images: extractImageUrls(html), sourceUrl: url };
  } catch {
    return { images: [], sourceUrl: url };
  }
}

// ===== FIRECRAWL WEB SEARCH FALLBACK =====
async function webSearchFallback(diagnosis: string, imageType: string): Promise<{ images: string[]; sourceUrl: string; sourceName: string }> {
  if (!FIRECRAWL_API_KEY) return { images: [], sourceUrl: "", sourceName: "" };

  const modalityTerm = MODALITY_TERMS[imageType] || imageType;
  const searchQuery = `${diagnosis} ${modalityTerm} real clinical image site:radiopaedia.org OR site:openi.nlm.nih.gov OR site:dermnetnz.org OR site:pathologyoutlines.com OR site:litfl.com`;

  try {
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery, limit: 3, scrapeOptions: { formats: ["html"] } }),
    });

    if (!resp.ok) return { images: [], sourceUrl: "", sourceName: "" };
    const data = await resp.json();
    const results = data?.data || [];

    for (const result of results) {
      const html = result?.html || "";
      const images = extractImageUrls(html);
      if (images.length > 0) {
        let sourceName = "web_search";
        try { sourceName = new URL(result?.url || "").hostname; } catch {}
        return { images, sourceUrl: result?.url || "", sourceName };
      }
    }
  } catch (err) {
    console.error("[WebSearch] Error:", err);
  }
  return { images: [], sourceUrl: "", sourceName: "" };
}

// ===== DOWNLOAD & UPLOAD =====
async function downloadAndUpload(imageUrl: string, imageType: string, assetCode: string): Promise<string | null> {
  try {
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return null;

    const contentType = imgResp.headers.get("content-type") || "image/jpeg";
    const buffer = new Uint8Array(await imgResp.arrayBuffer());
    if (buffer.length < 5000) return null;

    const ext = contentType.includes("png") ? "png" : "jpg";
    const safeCode = assetCode.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
    const filePath = `${imageType}/${safeCode}_curated_${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("question-images").upload(filePath, buffer, { contentType, upsert: true });
    if (error) { console.error("Upload error:", error); return null; }

    const { data: urlData } = supabase.storage.from("question-images").getPublicUrl(filePath);
    return urlData.publicUrl;
  } catch (err) {
    console.error("Download/upload error:", err);
    return null;
  }
}

// ===== SAFETY FILTER =====
function safetyFilter(imageUrl: string, imageType: string, sourceName: string): { safe: boolean; reason?: string } {
  const url = imageUrl.toLowerCase();

  // Block patient-identifiable content indicators
  if (url.includes("patient") && url.includes("photo") && !url.includes("pathology")) {
    return { safe: false, reason: "Potential PHI risk" };
  }

  // Block non-medical sources
  const untrustedDomains = ["shutterstock", "gettyimages", "istockphoto", "dreamstime", "stock", "pinterest", "instagram"];
  for (const d of untrustedDomains) {
    if (url.includes(d)) return { safe: false, reason: `Untrusted source: ${d}` };
  }

  // Basic modality cross-check
  const modalityKeywords: Record<string, string[]> = {
    ecg: ["ecg", "electrocardiogram", "ekg"],
    xray: ["xray", "x-ray", "radiograph", "chest"],
    ct: ["ct", "computed", "tomography"],
    us: ["ultrasound", "sonograph", "echo"],
    dermatology: ["derm", "skin", "cutaneous", "lesion"],
    pathology: ["pathology", "histology", "microscop", "h&e", "biopsy"],
    ophthalmology: ["eye", "retina", "fundus", "optic"],
  };

  // We don't block based on URL keywords alone — rely on source trust
  return { safe: true };
}

// ===== CLASSIFICATION =====
function classifyAsset(
  downloaded: boolean,
  sourceName: string,
  accessType: string,
  imageType: string
): { asset_origin: string; validation_level: string; visual_coherence_score: number; diagnostic_confidence_score: number; multimodal_ready: boolean } {
  const trustedSources = ["openi.nlm.nih.gov", "radiopaedia.org", "dermnetnz.org", "litfl.com", "ecgpedia.org", "pathologyoutlines.com", "eyewiki.aao.org", "medpix.nlm.nih.gov"];
  const isTrusted = trustedSources.some(s => sourceName.includes(s));

  if (!downloaded) {
    if (accessType === "credential_required") {
      return { asset_origin: "real_medical", validation_level: "bronze", visual_coherence_score: 0, diagnostic_confidence_score: 0, multimodal_ready: false };
    }
    return { asset_origin: "unknown", validation_level: "blocked", visual_coherence_score: 0, diagnostic_confidence_score: 0, multimodal_ready: false };
  }

  if (isTrusted) {
    return {
      asset_origin: "real_medical",
      validation_level: "silver",
      visual_coherence_score: 80,
      diagnostic_confidence_score: 75,
      multimodal_ready: false, // Never auto-approve — requires review
    };
  }

  return {
    asset_origin: "real_medical",
    validation_level: "bronze",
    visual_coherence_score: 60,
    diagnostic_confidence_score: 50,
    multimodal_ready: false,
  };
}

// ===== PROCESS SINGLE ASSET =====
async function processAsset(asset: {
  id: string;
  asset_code: string;
  image_type: string;
  diagnosis: string;
  specialty?: string;
  subtopic?: string;
  clinical_findings?: string[];
}) {
  const searchQueries: string[] = [];
  const issues: string[] = [];
  let selectedSource: { name: string; page_url: string; image_url: string; access_type: string } | null = null;
  let downloadStatus = "pending";
  let storagePath = "";
  let bestImageUrl = "";

  const { id, asset_code, image_type, diagnosis } = asset;
  const sources = PRIORITY_SOURCES[image_type] || PRIORITY_SOURCES["xray"];

  // Build search queries
  const baseQuery = diagnosis;
  const findingsQuery = asset.clinical_findings?.length ? `${diagnosis} ${asset.clinical_findings.slice(0, 2).join(" ")}` : "";
  const queries = [baseQuery, findingsQuery].filter(Boolean);

  // STEP 1: Try Open-i NIH first (direct API)
  for (const q of queries) {
    const nihQuery = `${q} ${MODALITY_TERMS[image_type] || image_type}`;
    searchQueries.push(`[Open-i] ${nihQuery}`);
    const { images, pageUrl } = await searchOpenI(nihQuery);

    if (images.length > 0) {
      for (const imgUrl of images.slice(0, 5)) {
        const safety = safetyFilter(imgUrl, image_type, "openi.nlm.nih.gov");
        if (!safety.safe) { issues.push(`Filtered: ${safety.reason}`); continue; }

        const uploaded = await downloadAndUpload(imgUrl, image_type, asset_code);
        if (uploaded) {
          bestImageUrl = uploaded;
          selectedSource = { name: "Open-i NIH", page_url: pageUrl, image_url: imgUrl, access_type: "open" };
          downloadStatus = "downloaded";
          break;
        }
      }
      if (bestImageUrl) break;
    }
  }

  // STEP 2: Try priority sources via Firecrawl scrape
  if (!bestImageUrl && FIRECRAWL_API_KEY) {
    for (const source of sources) {
      if (source.name === "Open-i NIH") continue; // Already tried
      for (const q of queries) {
        const searchUrl = source.searchUrl(q);
        searchQueries.push(`[${source.name}] ${searchUrl}`);

        if (source.requiresCredential) {
          selectedSource = { name: source.name, page_url: searchUrl, image_url: "", access_type: "credential_required" };
          downloadStatus = "pending_manual_access";
          issues.push(`Source ${source.name} requires credentials`);
          continue;
        }

        const { images } = await scrapeWithFirecrawl(searchUrl);
        for (const imgUrl of images.slice(0, 5)) {
          const safety = safetyFilter(imgUrl, image_type, source.name);
          if (!safety.safe) { issues.push(`Filtered: ${safety.reason}`); continue; }

          const uploaded = await downloadAndUpload(imgUrl, image_type, asset_code);
          if (uploaded) {
            bestImageUrl = uploaded;
            selectedSource = { name: source.name, page_url: searchUrl, image_url: imgUrl, access_type: "open" };
            downloadStatus = "downloaded";
            break;
          }
        }
        if (bestImageUrl) break;
        await new Promise(r => setTimeout(r, 1000));
      }
      if (bestImageUrl) break;
    }
  }

  // STEP 3: Web search fallback
  if (!bestImageUrl && FIRECRAWL_API_KEY) {
    searchQueries.push(`[WebSearch] ${diagnosis} ${MODALITY_TERMS[image_type] || image_type}`);
    const { images, sourceUrl, sourceName } = await webSearchFallback(diagnosis, image_type);

    for (const imgUrl of images.slice(0, 5)) {
      const safety = safetyFilter(imgUrl, image_type, sourceName);
      if (!safety.safe) { issues.push(`Filtered: ${safety.reason}`); continue; }

      const uploaded = await downloadAndUpload(imgUrl, image_type, asset_code);
      if (uploaded) {
        bestImageUrl = uploaded;
        selectedSource = { name: sourceName, page_url: sourceUrl, image_url: imgUrl, access_type: "open" };
        downloadStatus = "downloaded";
        break;
      }
    }
  }

  // STEP 4: Classify
  const sourceName = selectedSource?.name || "";
  const accessType = selectedSource?.access_type || "blocked";
  const classification = classifyAsset(downloadStatus === "downloaded", sourceName, accessType, image_type);

  if (downloadStatus !== "downloaded") {
    downloadStatus = downloadStatus === "pending_manual_access" ? "pending_manual_access" : "skipped";
    issues.push("No suitable real clinical image found");
  }

  // STEP 5: Update asset in DB
  if (downloadStatus === "downloaded" && bestImageUrl) {
    await supabase.from("medical_image_assets").update({
      image_url: bestImageUrl,
      thumbnail_url: bestImageUrl,
      asset_origin: classification.asset_origin,
      review_status: "needs_review",
      integrity_status: "pending",
      clinical_confidence: classification.diagnostic_confidence_score / 100,
      source_url: selectedSource?.page_url || "",
      source_domain: sourceName,
      license_type: sources.find(s => s.name === sourceName)?.license || "unknown",
      validation_level: classification.validation_level,
      multimodal_ready: false,
      visual_coherence_score: classification.visual_coherence_score,
      diagnostic_confidence_score: classification.diagnostic_confidence_score,
      access_type: "open",
      curation_notes: `Curated from ${sourceName} on ${new Date().toISOString()}. Requires manual review.`,
    }).eq("id", id);
  } else {
    await supabase.from("medical_image_assets").update({
      validation_level: classification.validation_level,
      multimodal_ready: false,
      access_type: accessType,
      curation_notes: `No image found. Status: ${downloadStatus}. Issues: ${issues.join("; ")}`,
    }).eq("id", id);
  }

  // STEP 6: Log curation
  const logEntry = {
    asset_id: id,
    asset_code,
    image_type,
    diagnosis,
    search_queries: searchQueries,
    selected_source: selectedSource,
    download_status: downloadStatus,
    storage_path: storagePath,
    classification,
    issues,
    notes: `Processed ${diagnosis} (${image_type}) — ${downloadStatus}`,
  };
  await supabase.from("image_curation_log").insert(logEntry);

  return {
    asset_id: id,
    asset_code,
    search_queries: searchQueries,
    selected_source: selectedSource,
    download: { status: downloadStatus, storage_path: storagePath },
    classification,
    issues,
    notes: logEntry.notes,
  };
}

// ===== MAIN HANDLER =====
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image_type, batch_size = 3, offset = 0, asset_id } = body;

    // Single asset mode
    if (asset_id) {
      const { data: asset } = await supabase.from("medical_image_assets")
        .select("id, asset_code, image_type, diagnosis, specialty, subtopic, clinical_findings")
        .eq("id", asset_id).single();

      if (!asset) {
        return new Response(JSON.stringify({ error: "Asset not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const result = await processAsset(asset);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Batch mode
    if (!image_type) {
      return new Response(JSON.stringify({ error: "image_type is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const size = Math.min(batch_size, 5);
    const { data: assets } = await supabase.from("medical_image_assets")
      .select("id, asset_code, image_type, diagnosis, specialty, subtopic, clinical_findings")
      .eq("image_type", image_type)
      .eq("is_active", true)
      .or("asset_origin.eq.educational_ai,asset_origin.is.null,asset_origin.eq.generic_ai,asset_origin.eq.unknown,validation_level.eq.blocked")
      .order("diagnosis")
      .range(offset, offset + size - 1);

    if (!assets || assets.length === 0) {
      return new Response(JSON.stringify({ message: "No eligible assets", results: [], summary: { processed: 0, downloaded: 0, pending_manual_access: 0, blocked: 0, multimodal_ready: 0 } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const results = [];
    const summary = { processed: 0, downloaded: 0, pending_manual_access: 0, blocked: 0, skipped: 0, multimodal_ready: 0, by_modality: {} as Record<string, number>, by_source: {} as Record<string, number> };

    for (const asset of assets) {
      const result = await processAsset(asset);
      results.push(result);
      summary.processed++;

      if (result.download.status === "downloaded") {
        summary.downloaded++;
        const src = result.selected_source?.name || "unknown";
        summary.by_source[src] = (summary.by_source[src] || 0) + 1;
      } else if (result.download.status === "pending_manual_access") {
        summary.pending_manual_access++;
      } else if (result.download.status === "skipped") {
        summary.skipped++;
      } else {
        summary.blocked++;
      }

      summary.by_modality[image_type] = (summary.by_modality[image_type] || 0) + 1;
      if (result.classification.multimodal_ready) summary.multimodal_ready++;

      // Rate limiting between assets
      await new Promise(r => setTimeout(r, 2000));
    }

    const has_more = assets.length === size;

    return new Response(JSON.stringify({ results, summary, has_more, next_offset: offset + assets.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Curation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
