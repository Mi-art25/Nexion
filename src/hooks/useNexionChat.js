// src/hooks/useNexionChat.ts
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UseNexionChatReturn = {
  messages: Message[];
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  isLoading: boolean;
  analyzePDF?: (pdfText: string, prompt: string) => Promise<string>;
  lastProvider?: string | null;
};

export function useNexionChat(): UseNexionChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState(null);

  const sendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: message }] }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (data.provider) setLastProvider(data.provider);
    } catch (error) {
      console.error("[useNexionChat] Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, an error occurred. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePDF = async (pdfText: string, prompt: string): Promise<string> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: prompt, pdfText }
          ],
          type: "pdf",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.provider) setLastProvider(data.provider);
      return data.reply || "";
    } catch (error) {
      console.error("[analyzePDF] Error:", error);
      return "Error analyzing PDF. Please try again.";
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return { messages, sendMessage, clearMessages, setMessages, isLoading, analyzePDF, lastProvider };
}