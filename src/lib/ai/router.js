// src/lib/ai/router.js
// Smart AI router for Nexion — Groq → Gemini → OpenRouter

import { callGemini, callGroq, callOpenRouter } from "./providers";

// ─── Helpers ─────────────────────────────────────────────────

function hasPDF(messages) {
  return messages.some((m) => m.pdfText);
}

function getPDFText(messages) {
  return messages.find((m) => m.pdfText)?.pdfText ?? null;
}

function injectPDF(messages, pdfText) {
  return [
    {
      role: "user",
      content: `Document context for this conversation:\n\n${pdfText}`,
    },
    {
      role: "assistant",
      content: "Understood. I have read the document and am ready to help.",
    },
    ...messages,
  ];
}

// ─── Router ──────────────────────────────────────────────────

export async function routeAI({ messages, systemPrompt, type = "auto" }) {
  const withPDF = hasPDF(messages);
  const pdfText = getPDFText(messages);

  // Strip pdfText field — providers only need role + content
  const cleanMessages = messages.map(({ role, content }) => ({ role, content }));
  const finalMessages = withPDF ? injectPDF(cleanMessages, pdfText) : cleanMessages;

  // PDF → Gemini first (1M context), fallback to OpenRouter
  if (withPDF || type === "pdf") {
    try {
      const text = await callGemini(finalMessages, systemPrompt);
      return { text, provider: "gemini" };
    } catch (e) {
      console.warn("[Router] Gemini failed on PDF →", e.message, "→ trying OpenRouter");
      const text = await callOpenRouter(cleanMessages, systemPrompt);
      return { text, provider: "openrouter" };
    }
  }

  // No PDF: Groq (fastest) → Gemini → OpenRouter
  // Falls back on ANY error, not just rate limits
  try {
    const text = await callGroq(finalMessages, systemPrompt);
    return { text, provider: "groq" };
  } catch (e) {
    console.warn("[Router] Groq failed →", e.message, "→ trying Gemini");
  }

  try {
    const text = await callGemini(finalMessages, systemPrompt);
    return { text, provider: "gemini" };
  } catch (e) {
    console.warn("[Router] Gemini failed →", e.message, "→ trying OpenRouter");
  }

  const text = await callOpenRouter(finalMessages, systemPrompt);
  return { text, provider: "openrouter" };
}