// app/api/chat/route.js
// Main chat endpoint for Nexion — uses smart AI router + Semantic Scholar

import { routeAI } from "@/lib/ai/router";
import { getSession } from '../../../lib/supabase';
import { OpenAI } from 'openai';
import rateLimit from 'express-rate-limit';

const THESIS_SYSTEM_PROMPT = `You are Nexion, an intelligent academic AI assistant specialized in helping students with their thesis research.

Your capabilities:
- Analyze and summarize thesis chapters and academic papers
- Help with literature reviews and finding related studies
- Suggest research methodologies
- Explain academic concepts clearly
- Help structure arguments and outlines
- Provide citations guidance (APA, MLA, Chicago)

IMPORTANT RESTRICTION:
You must ONLY answer questions related to academic research, thesis writing, dissertations, academic papers, study, education, or scholarly topics.

If the user asks about anything unrelated to academics or thesis work (e.g. cooking, entertainment, sports, personal advice, general trivia, etc.), decline with this exact response:
"I'm Nexion, a thesis research assistant. I can only help with academic topics like thesis writing, research methodology, literature reviews, and citations. Is there something research-related I can help you with?"

Do not answer off-topic questions even if the user insists. Stay strictly within academic scope.

Always respond in a clear, academic but friendly tone. When analyzing documents, be thorough and cite specific sections when relevant.`;

// ─── Semantic Scholar Search ──────────────────────────────────
async function searchSemanticScholar(query) {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,authors,year,abstract,externalIds,citationCount`;

    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // 8 second timeout so it doesn't hang the chat
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();

    return (data.data || []).map(p => ({
      title: p.title || "Untitled",
      authors: p.authors?.map(a => a.name).join(", ") || "Unknown authors",
      year: p.year || "n.d.",
      snippet: p.abstract
        ? p.abstract.slice(0, 300) + (p.abstract.length > 300 ? "…" : "")
        : "No abstract available.",
      citations: p.citationCount ?? 0,
      link: p.externalIds?.DOI
        ? `https://doi.org/${p.externalIds.DOI}`
        : `https://www.semanticscholar.org/paper/${p.paperId}`,
    }));
  } catch (err) {
    // Silently fail — don't block the chat if Scholar is down
    console.warn("[Semantic Scholar] Search failed:", err.message);
    return [];
  }
}

// ─── Should we search Scholar for this message? ───────────────
function shouldSearchScholar(message) {
  if (!message) return false;
  const lower = message.toLowerCase();

  // Skip short or simple messages
  if (lower.split(" ").length < 4) return false;

  // Keywords that signal a literature/research query
  const researchSignals = [
    "research", "study", "studies", "paper", "papers", "article",
    "literature", "review", "methodology", "thesis", "dissertation",
    "journal", "academic", "scholar", "citation", "reference",
    "theory", "framework", "findings", "evidence", "survey",
    "experiment", "analysis", "hypothesis", "related works",
  ];

  return researchSignals.some(word => lower.includes(word));
}

// ─── Strip markdown bold markers (**text** → text) ────────────
function stripBold(text) {
  return text.replace(/\*\*(.*?)\*\*/g, "$1");
}

// ─── Route Handler ────────────────────────────────────────────
export async function POST(req) {
  try {
    const { messages, type = "auto" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Get the latest user message
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");

    // Search Semantic Scholar if the message looks like a research query
    let scholarContext = "";
    if (lastUserMsg && shouldSearchScholar(lastUserMsg.content)) {
      const results = await searchSemanticScholar(lastUserMsg.content);

      if (results.length > 0) {
        scholarContext = `\n\n---\nRELEVANT ACADEMIC SOURCES (retrieved from Semantic Scholar):\n\n` +
          results.map((r, i) =>
            `[${i + 1}] "${r.title}"
   Authors: ${r.authors}
   Year: ${r.year} | Citations: ${r.citations}
   Abstract: ${r.snippet}
   Link: ${r.link}`
          ).join("\n\n") +
          `\n\nUse these sources to enrich your response where relevant. Always cite them as [1], [2], etc. and include the full reference at the end.\n---`;
      }
    }

    const { text, provider } = await routeAI({
      messages,
      systemPrompt: THESIS_SYSTEM_PROMPT + scholarContext,
      type,
    });

    return Response.json({
      reply: stripBold(text),
      provider,
      // Let frontend know if Scholar results were used
      scholarUsed: scholarContext.length > 0,
    });
  } catch (err) {
    console.error("[Nexion Chat API] Error:", err);
    return Response.json(
      { error: "All AI providers failed. Please try again later." },
      { status: 503 }
    );
  }
}

// ─── Auth Middleware ───────────────────────────────────────────
export async function handler(req, res) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ...existing code...
}

// ─── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

export default async function handler(req, res) {
  await limiter(req, res, () => {});

  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const openai = new OpenAI(process.env.OPENAI_API_KEY);
  const stream = new ReadableStream({
    async start(controller) {
      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: req.body.messages,
        stream: true,
      });

      for await (const chunk of response) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}