// app/api/chat/route.js
// Main chat endpoint for Nexion — uses smart AI router

import { routeAI } from "@/lib/ai/router";

const THESIS_SYSTEM_PROMPT = `You are Nexion, an intelligent academic AI assistant specialized in helping students with their thesis research.

Your capabilities:
- Analyze and summarize thesis chapters and academic papers
- Help with literature reviews and finding related studies
- Suggest research methodologies
- Explain academic concepts clearly
- Help structure arguments and outlines
- Provide citations guidance (APA, MLA, Chicago)

Always respond in a clear, academic but friendly tone. When analyzing documents, be thorough and cite specific sections when relevant.`;

export async function POST(req) {
  try {
    const { messages, type = "auto" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const { text, provider } = await routeAI({
      messages,
      systemPrompt: THESIS_SYSTEM_PROMPT,
      type,
    });

    return Response.json({
      reply: text,
      provider, // tells frontend which AI responded
    });
  } catch (err) {
    console.error("[Nexion Chat API] Error:", err);
    return Response.json(
      { error: "All AI providers failed. Please try again later." },
      { status: 503 }
    );
  }
}