export const config = { runtime: 'edge' };

const BASE = 'https://api.sistrix.com';

async function sistrixGet(endpoint, params, apiKey) {
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(12000) });
  const json = await res.json();
  if (json.status === 'fail') throw new Error(json.error?.[0]?.error_message || 'Sistrix-Fehler');
  return json;
}

function extractDomain(rawUrl) {
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

function parseVisibility(raw) {
  if (!raw) return 0;
  return parseFloat(raw?.answer?.[0]?.sichtbarkeitsindex?.[0]?.value ?? 0);
}

function parseTraffic(raw) {
  const pages = raw?.answer?.[0]?.result ?? [];
  const totalClicks = pages.reduce((s, p) => s + (p.click_estimation || 0), 0);
  const totalKeywords = pages.reduce((s, p) => s + (p.keywords || 0), 0);
  const totalValue = pages.reduce((s, p) => s + (p.estimated_value || 0), 0);
  const topPages = pages
    .filter(p => p.click_estimation > 0)
    .sort((a, b) => b.click_estimation - a.click_estimation)
    .slice(0, 8)
    .map(p => ({
      path: p.path.replace(/^https?:\/\/[^/]+/, '') || '/',
      fullUrl: p.path,
      clicks: Math.round(p.click_estimation),
      keywords: p.keywords,
      value: Math.round(p.estimated_value),
      share: p.share,
    }));
  return { totalClicks: Math.round(totalClicks), totalKeywords, totalValue: Math.round(totalValue), topPages };
}

export default async function handler(req) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });

  const apiKey = process.env.SISTRIX_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'SISTRIX_API_KEY nicht gesetzt' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });

  const { url, competitors = [] } = await req.json();
  if (!url) return new Response(JSON.stringify({ error: 'URL fehlt' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });

  const mainDomain = extractDomain(url);
  // Accept up to 14 competitors (main + 14 = max 15 total before filtering to top 10)
  const compDomains = [...new Set(competitors.map(extractDomain))].slice(0, 14);

  // Step 1: Fetch visibility for main + all competitors in parallel
  const allDomains = [mainDomain, ...compDomains];
  const visResults = await Promise.allSettled(
    allDomains.map(d => sistrixGet('domain.visibilityindex', { domain: d }, apiKey))
  );

  const visMap = {};
  allDomains.forEach((d, i) => {
    visMap[d] = visResults[i].status === 'fulfilled' ? parseVisibility(visResults[i].value) : null;
  });

  // Step 2: Keep main + top 9 competitors by visibility = top 10 total
  const sortedComps = compDomains
    .filter(d => visMap[d] !== null)
    .sort((a, b) => (visMap[b] ?? 0) - (visMap[a] ?? 0))
    .slice(0, 9);

  const top10 = [mainDomain, ...sortedComps];

  // Step 3: Fetch traffic for those top 10 in parallel
  const trafficResults = await Promise.allSettled(
    top10.map(d => sistrixGet('domain.traffic.estimation', { domain: d }, apiKey))
  );

  const trafficMap = {};
  top10.forEach((d, i) => {
    trafficMap[d] = trafficResults[i].status === 'fulfilled' ? trafficResults[i].value : null;
  });

  // Build main domain result
  const mainTraffic = parseTraffic(trafficMap[mainDomain]);

  // Build competitor results (full data like main)
  const competitorData = sortedComps.map(d => {
    const traffic = parseTraffic(trafficMap[d]);
    return {
      domain: d,
      visibility: visMap[d] ?? 0,
      totalClicks: traffic.totalClicks,
      totalKeywords: traffic.totalKeywords,
      totalValue: traffic.totalValue,
      topPages: traffic.topPages,
    };
  });

  const result = {
    domain: mainDomain,
    visibility: visMap[mainDomain] ?? 0,
    totalClicks: mainTraffic.totalClicks,
    totalKeywords: mainTraffic.totalKeywords,
    totalValue: mainTraffic.totalValue,
    topPages: mainTraffic.topPages,
    competitors: competitorData,
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
