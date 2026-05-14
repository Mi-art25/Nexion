// src/hooks/useNexionChat.js
import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UseNexionChatReturn = {
  messages: Message[];
  sendMessage: (message: string) => void;
};

export default function useNexionChat(): UseNexionChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = async (message: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, { role: "user", content: message }] }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let aiMessage = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      aiMessage += decoder.decode(value, { stream: true });
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: aiMessage }]);
    }

    setMessages((prev) => [...prev, { role: "assistant", content: aiMessage }]);
  };

  return { messages, sendMessage };
}