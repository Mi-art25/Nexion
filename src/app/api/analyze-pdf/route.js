// app/api/analyze-pdf/route.js
// PDF Analysis endpoint — always uses Gemini for its 1M token context window

import { routeAI } from "@/lib/ai/router";
import { getSession } from "../../../lib/supabase";
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

export async function POST(req) {
  await limiter(req, res, () => {});

  try {
    const session = await getSession(req);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pdfText, question } = await req.json();

    if (!pdfText) {
      return Response.json({ error: "No PDF text provided" }, { status: 400 });
    }

    const messages = [
      {
        role: "user",
        content: `Here is the thesis document content:\n\n${pdfText}\n\n---\n\n${
          question || "Please provide a comprehensive analysis of this thesis including: main topic, research objectives, methodology, key findings, and suggestions for improvement."
        }`,
      },
    ];

    const systemPrompt = `You are Nexion, an expert academic AI. Analyze the provided thesis document thoroughly. 
Structure your analysis with clear sections. Be specific and reference actual content from the document.
Identify strengths, gaps in literature, methodology concerns, and areas for improvement.`;

    // Always use Gemini for PDF analysis (long context)
    const { text, provider } = await routeAI({
      messages,
      systemPrompt,
      type: "pdf",
    });

    return Response.json({ analysis: text, provider });
  } catch (err) {
    console.error("[Nexion PDF API] Error:", err);
    return Response.json(
      { error: "PDF analysis failed. Please try again." },
      { status: 503 }
    );
  }
}