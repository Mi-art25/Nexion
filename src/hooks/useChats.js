// src/hooks/useChats.js
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export function useChats(userId, projectId = null) {
  const [recents, setRecents] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const activeChatIdRef = useRef(null);
  activeChatIdRef.current = activeChatId;

  // ── Load sidebar list whenever the user or project changes ──
  const fetchRecents = useCallback(async () => {
    if (!userId) { setRecents([]); return; }

    let query = supabase
      .from("chats")
      .select("id, label, favorited, project_id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);

    // If we're inside a project, only show that project's chats
    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    if (!error && data) setRecents(data);
  }, [userId, projectId]);

  useEffect(() => {
    fetchRecents();
    if (!userId) setActiveChatId(null);
  }, [fetchRecents, userId]);

  // ── Load messages for a past chat ───────────────────────────
  const loadChat = useCallback(async (chatId) => {
    setActiveChatId(chatId);
    activeChatIdRef.current = chatId;

    const { data, error } = await supabase
      .from("messages")
      .select("role, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data;
  }, []);

  // ── Create a new chat row, linked to project if provided ────
  const createChat = useCallback(async (label) => {
    if (!userId) return null;

    const insert = { user_id: userId, label };
    if (projectId) insert.project_id = projectId; // ← key fix

    const { data, error } = await supabase
      .from("chats")
      .insert([insert])
      .select("id, label, favorited, project_id")
      .single();

    if (error || !data) {
      console.error("[useChats] createChat failed:", error?.message);
      return null;
    }

    setActiveChatId(data.id);
    activeChatIdRef.current = data.id;
    setRecents(prev => [data, ...prev]);
    return data.id;
  }, [userId, projectId]);

  // ── Save a single message ────────────────────────────────────
  const saveMessage = useCallback(async (role, content, chatLabel) => {
    if (!userId) return;

    let chatId = activeChatIdRef.current;

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

    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

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

    setRecents(prev => prev.map(r => r.id === id ? { ...r, favorited: next } : r));

    const { error } = await supabase
      .from("chats")
      .update({ favorited: next })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setRecents(prev => prev.map(r => r.id === id ? { ...r, favorited: !next } : r));
    }
  }, [recents, userId]);

  // ── Rename chat ──────────────────────────────────────────────
  const renameChat = useCallback(async (id, newLabel) => {
    setRecents(prev => prev.map(r => r.id === id ? { ...r, label: newLabel } : r));

    const { error } = await supabase
      .from("chats")
      .update({ label: newLabel })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[useChats] renameChat failed:", error.message);
      fetchRecents();
    }
  }, [userId, fetchRecents]);

  // ── Delete chat ──────────────────────────────────────────────
  const deleteChat = useCallback(async (id) => {
    setRecents(prev => prev.filter(r => r.id !== id));

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
      fetchRecents();
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