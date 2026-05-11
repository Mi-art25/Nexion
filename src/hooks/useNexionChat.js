// src/hooks/useNexionChat.js
import { useState, useCallback } from "react";

export function useNexionChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState(null);

  const sendMessage = useCallback(async (content, pdfText = null) => {
    if (!content.trim()) return;

    const userMessage = { role: "user", content, ...(pdfText && { pdfText }) };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, type: pdfText ? "pdf" : "auto" }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setLastProvider(data.provider);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  // One-shot PDF analysis — does NOT update message history
  const analyzePDF = useCallback(async (pdfText, prompt) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt, pdfText }],
          type: "pdf",
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setLastProvider(data.provider);
      return data.reply;
    } catch {
      return "Analysis failed. Please try again.";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastProvider(null);
  }, []);

  return { messages, isLoading, sendMessage, analyzePDF, clearMessages, lastProvider };
}