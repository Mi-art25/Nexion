"use client";

import { useState, useRef, useCallback } from "react";
import { useNexionChat } from "@/hooks/useNexionChat";

const ANALYSIS_PROMPTS = [
  { label: "Research Gaps", prompt: "What are the research gaps or limitations identified in this document?" },
  { label: "Key Arguments", prompt: "What are the main arguments or claims made in this document?" },
  { label: "Methodology", prompt: "Summarize the research methodology used in this document." },
  { label: "Literature Review", prompt: "Summarize the literature review and key referenced works." },
  { label: "Findings", prompt: "What are the main findings or conclusions of this document?" },
  { label: "Full Summary", prompt: "Give me a comprehensive academic summary of this entire document." },
];

const PROVIDER_COLORS = {
  gemini: "#4285f4",
  groq: "#f97316",
  openrouter: "#8b5cf6",
};

export default function AnalyzePage() {
  const { analyzePDF, isLoading, lastProvider } = useNexionChat();
  const [pdfText, setPdfText] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState("");
  const [activePrompt, setActivePrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const extractTextFromPDF = useCallback(async (file) => {
    setError("");
    try {
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
      GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
      }

      if (!text.trim()) throw new Error("No text found in PDF. It may be scanned.");
      setPdfText(text);
      setFileName(file.name);
      setResult("");
      setActivePrompt("");
    } catch (err) {
      setError(err.message || "Failed to read PDF. Please try another file.");
    }
  }, []);

  const handleFile = useCallback((file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    extractTextFromPDF(file);
  }, [extractTextFromPDF]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = async (prompt) => {
    if (!pdfText || isLoading) return;
    setActivePrompt(prompt);
    setResult("");
    const analysis = await analyzePDF(pdfText, prompt);
    setResult(analysis);
  };

  const handleCustom = () => {
    if (!customPrompt.trim()) return;
    handleAnalyze(customPrompt.trim());
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060a10",
      color: "#e2e8f0",
      fontFamily: "Georgia, serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "monospace",
          }}>N</div>
          <span style={{ fontSize: "16px", color: "#e2e8f0", letterSpacing: "0.02em" }}>Nexion</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {lastProvider && (
            <div style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "11px", fontFamily: "monospace",
              color: PROVIDER_COLORS[lastProvider] || "#64748b",
              border: `1px solid ${PROVIDER_COLORS[lastProvider]}30`,
              padding: "4px 12px", borderRadius: "999px",
              background: `${PROVIDER_COLORS[lastProvider]}08`,
            }}>
              <span style={{
                width: "5px", height: "5px", borderRadius: "50%",
                background: PROVIDER_COLORS[lastProvider],
                display: "inline-block",
              }} />
              {lastProvider}
            </div>
          )}
          <a href="/chat" style={{
            fontSize: "13px", color: "#64748b", textDecoration: "none",
            letterSpacing: "0.03em",
          }}>← Chat</a>
        </div>
      </nav>

      <div style={{
        flex: 1, display: "grid",
        gridTemplateColumns: pdfText ? "1fr 1fr" : "1fr",
        gap: "0",
        maxWidth: "1200px", margin: "0 auto", width: "100%",
        padding: "2rem 1.5rem",
        transition: "grid-template-columns 0.3s",
      }}>

        {/* Left — Upload + Prompts */}
        <div style={{ paddingRight: pdfText ? "2rem" : "0" }}>

          <h1 style={{
            fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: "400",
            letterSpacing: "-0.02em", marginBottom: "0.5rem",
          }}>
            Analyze a{" "}
            <span style={{ fontStyle: "italic", color: "#60a5fa" }}>document</span>
          </h1>
          <p style={{ fontSize: "13px", color: "#334155", marginBottom: "2rem", lineHeight: "1.7" }}>
            Upload your thesis, paper, or chapter. Nexion reads it and answers your questions.
          </p>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1px dashed ${isDragging ? "#3b82f6" : pdfText ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: "12px",
              padding: "2.5rem",
              textAlign: "center",
              cursor: "pointer",
              background: isDragging
                ? "rgba(59,130,246,0.06)"
                : pdfText
                  ? "rgba(59,130,246,0.04)"
                  : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
              marginBottom: "1.5rem",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {pdfText ? (
              <>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>✓</div>
                <p style={{ fontSize: "14px", color: "#60a5fa", marginBottom: "4px" }}>{fileName}</p>
                <p style={{ fontSize: "12px", color: "#334155" }}>Click to replace</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: "28px", marginBottom: "10px", color: "#1e293b" }}>⬆</div>
                <p style={{ fontSize: "14px", color: "#475569", marginBottom: "4px" }}>
                  Drop your PDF here or click to browse
                </p>
                <p style={{ fontSize: "12px", color: "#1e293b" }}>Thesis, paper, chapter — any PDF</p>
              </>
            )}
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
              color: "#f87171", marginBottom: "1.5rem",
            }}>{error}</div>
          )}

          {/* Analysis prompts */}
          {pdfText && (
            <>
              <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#334155", marginBottom: "1rem", fontFamily: "monospace" }}>
                QUICK ANALYSIS
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "1.5rem" }}>
                {ANALYSIS_PROMPTS.map(({ label, prompt }) => (
                  <button
                    key={label}
                    onClick={() => handleAnalyze(prompt)}
                    disabled={isLoading}
                    style={{
                      background: activePrompt === prompt
                        ? "rgba(29,78,216,0.2)"
                        : "rgba(255,255,255,0.02)",
                      border: activePrompt === prompt
                        ? "1px solid rgba(59,130,246,0.4)"
                        : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      textAlign: "left",
                      cursor: isLoading ? "default" : "pointer",
                      color: activePrompt === prompt ? "#93c5fd" : "#64748b",
                      fontSize: "13px",
                      fontFamily: "Georgia, serif",
                      transition: "all 0.15s",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span>{label}</span>
                    {isLoading && activePrompt === prompt && (
                      <span style={{ fontSize: "11px", color: "#3b82f6", fontFamily: "monospace" }}>analyzing…</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom prompt */}
              <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#334155", marginBottom: "0.75rem", fontFamily: "monospace" }}>
                CUSTOM QUESTION
              </p>
              <div style={{
                display: "flex", gap: "8px", alignItems: "flex-end",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px", padding: "8px 10px",
              }}>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustom()}
                  placeholder="Ask anything about the document…"
                  style={{
                    flex: 1, background: "none", border: "none", outline: "none",
                    color: "#e2e8f0", fontSize: "13px", fontFamily: "Georgia, serif",
                  }}
                />
                <button
                  onClick={handleCustom}
                  disabled={!customPrompt.trim() || isLoading}
                  style={{
                    background: customPrompt.trim() && !isLoading ? "#1d4ed8" : "rgba(255,255,255,0.05)",
                    border: "none", borderRadius: "6px",
                    width: "30px", height: "30px",
                    cursor: customPrompt.trim() && !isLoading ? "pointer" : "default",
                    color: customPrompt.trim() && !isLoading ? "#fff" : "#334155",
                    fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s", flexShrink: 0,
                  }}
                >↑</button>
              </div>
            </>
          )}
        </div>

        {/* Right — Results */}
        {pdfText && (
          <div style={{
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            paddingLeft: "2rem",
          }}>
            <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#334155", marginBottom: "1.5rem", fontFamily: "monospace" }}>
              ANALYSIS RESULT
            </p>

            {!result && !isLoading && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "300px",
                color: "#1e293b", textAlign: "center",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "1rem", fontFamily: "monospace" }}>◎</div>
                <p style={{ fontSize: "13px", lineHeight: "1.8" }}>
                  Select an analysis type<br />or ask a custom question
                </p>
              </div>
            )}

            {isLoading && (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "1.5rem",
              }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "1rem" }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#3b82f6", display: "inline-block",
                      animation: "pulse 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: "13px", color: "#334155" }}>Reading your document…</p>
              </div>
            )}

            {result && !isLoading && (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px", padding: "1.5rem",
                fontSize: "14px", lineHeight: "1.9",
                color: "#cbd5e1", whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "calc(100vh - 280px)",
                overflowY: "auto",
              }}>
                {result}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        input::placeholder { color: #1e293b; }
      `}</style>
    </div>
  );
}
