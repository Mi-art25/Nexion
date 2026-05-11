// lib/ai/providers.js
// Multi-AI Provider Manager for Nexion
// Gemini (main) → Groq (fast Q&A) → OpenRouter (fallback)

// ─── GEMINI ──────────────────────────────────────────────────────────────────
export async function callGemini(messages, systemPrompt = "") {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",           // ← was: gemini-1.5-flash (deprecated)
    systemInstruction: systemPrompt,
  });

  // Convert messages array to Gemini chat history format
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const lastMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(lastMessage);

  return result.response.text();
}

// ─── GROQ ─────────────────────────────────────────────────────────────────────
export async function callGroq(messages, systemPrompt = "") {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",     // ← was: llama3-8b-8192 (decommissioned)
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages,
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw Object.assign(new Error(err.error?.message || "Groq error"), {
      status: response.status,
    });
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─── OPENROUTER (FALLBACK) ────────────────────────────────────────────────────
export async function callOpenRouter(messages, systemPrompt = "") {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Nexion Thesis AI",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct:free", // ← was: mistralai/mistral-7b-instruct:free (no endpoints)
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages,
      ],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw Object.assign(new Error(err.error?.message || "OpenRouter error"), {
      status: response.status,
    });
  }

  const data = await response.json();
  return data.choices[0].message.content;
}