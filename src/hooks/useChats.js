// src/hooks/useChats.js
// Supabase persistence for chat sessions and messages.
// Replaces the React-state-only recents array in chat/page.jsx.
//
// Usage:
//   const {
//     recents,          // [{ id, label, favorited }]  — sidebar list
//     activeChatId,     // uuid of the open chat (or null)
//     loadChat,         // (chatId) → messages[]  — called when user clicks a recent
//     saveMessage,      // (role, content) → void  — call after every send/reply
//     startNewChat,     // () → void  — clears active chat, ready for fresh session
//     toggleFavorite,   // (id) → void
//     renameChat,       // (id, newLabel) → void
//     deleteChat,       // (id) → void
//   } = useChats(userId);

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function useChats(userId) {
  const [recents, setRecents] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Keep activeChatId in a ref so callbacks always see the latest value
  // without needing to re-create themselves.
  const activeChatIdRef = useRef(null);
  activeChatIdRef.current = activeChatId;

  // ── Load sidebar list whenever the user changes ─────────────
  const fetchRecents = useCallback(async () => {
    if (!userId) { setRecents([]); return; }
    const { data, error } = await supabase
      .from("chats")
      .select("id, label, favorited")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!error && data) setRecents(data);
  }, [userId]);

  useEffect(() => {
    fetchRecents();
    // Reset active chat when user logs out
    if (!userId) setActiveChatId(null);
  }, [fetchRecents, userId]);

  // ── Load messages for a past chat ───────────────────────────
  // Returns the messages array so the caller can pass it to useNexionChat.
  const loadChat = useCallback(async (chatId) => {
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;

    const { data, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data; // [{ role, content }, ...]
  }, []);

  // ── Create a new chat row in Supabase ────────────────────────
  // Called lazily on the first message of a new session.
  const createChat = useCallback(async (label) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("chats")
      .insert([{ user_id: userId, label }])
      .select("id, label, favorited")
      .single();

    if (error || !data) {
      console.error("[useChats] createChat failed:", error?.message);
      return null;
    }

    setActiveChatId(data.id);
    activeChatIdRef.current = data.id;
    setRecents(prev => [data, ...prev]);
    return data.id;
  }, [userId]);

  // ── Save a single message ────────────────────────────────────
  // If no chat exists yet (first message), creates the chat first.
  const saveMessage = useCallback(async (role, content, chatLabel) => {
    if (!userId) return; // not logged in — skip silently

    let chatId = activeChatIdRef.current;

    // First message of a new session → create the chat row
    if (!chatId) {
      chatId = await createChat(chatLabel || "New Chat");
      if (!chatId) return;
    }

    const { error } = await supabase
      .from("messages")
      .insert([{ chat_id: chatId, user_id: userId, role, content }]);

    if (error) {
      console.error("[useChats] saveMessage failed:", error.message);
      return;
    }

    // Bump updated_at on the chat so it floats to the top of recents
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    // Refresh recents order
    fetchRecents();
  }, [userId, createChat, fetchRecents]);

  // ── Start a brand-new chat ───────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveChatId(null);
    activeChatIdRef.current = null;
  }, []);

  // ── Toggle favorite ──────────────────────────────────────────
  const toggleFavorite = useCallback(async (id) => {
    const chat = recents.find(r => r.id === id);
    if (!chat) return;
    const next = !chat.favorited;

    // Optimistic update
    setRecents(prev => prev.map(r => r.id === id ? { ...r, favorited: next } : r));

    const { error } = await supabase
      .from("chats")
      .update({ favorited: next })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      // Roll back
      setRecents(prev => prev.map(r => r.id === id ? { ...r, favorited: !next } : r));
    }
  }, [recents, userId]);

  // ── Rename chat ──────────────────────────────────────────────
  const renameChat = useCallback(async (id, newLabel) => {
    // Optimistic update
    setRecents(prev => prev.map(r => r.id === id ? { ...r, label: newLabel } : r));

    const { error } = await supabase
      .from("chats")
      .update({ label: newLabel })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[useChats] renameChat failed:", error.message);
      fetchRecents(); // re-sync on failure
    }
  }, [userId, fetchRecents]);

  // ── Delete chat ──────────────────────────────────────────────
  const deleteChat = useCallback(async (id) => {
    // Optimistic update
    setRecents(prev => prev.filter(r => r.id !== id));

    // Clear active chat if it's the one being deleted
    if (activeChatIdRef.current === id) {
      setActiveChatId(null);
      activeChatIdRef.current = null;
    }

    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[useChats] deleteChat failed:", error.message);
      fetchRecents(); // re-sync on failure
    }
  }, [userId, fetchRecents]);

  return {
    recents,
    activeChatId,
    loadChat,
    saveMessage,
    startNewChat,
    toggleFavorite,
    renameChat,
    deleteChat,
  };
}

// TypeScript type definitions
type Chat = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
};

type UseChatsReturn = {
  chats: Chat[];
  loadChat: () => void;
  saveMessage: (message: string) => void;
};

export default function useChats(): UseChatsReturn {
  const [chats, setChats] = useState<Chat[]>([]);

  const loadChat = () => {
    // Load chat history logic
  };

  const saveMessage = (message: string) => {
    // Save message logic
  };

  return { chats, loadChat, saveMessage };
}