"use client";

import { useNexionChat } from "@/hooks/useNexionChat";
import { useChats } from "@/hooks/useChats";
import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "./Sidebar";
import MaterialPanel from "./MaterialPanel";
import AuthModal from "./AuthModal";

const MATERIAL_WORD_THRESHOLD = 120;

function isMaterial(content) {
  if (!content || typeof content !== "string") return false;
  return content.trim().split(/\s+/).length >= MATERIAL_WORD_THRESHOLD;
}

// ─── Icons ────────────────────────────────────────────────────
const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IconDocument = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconFile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
  </svg>
);
const IconStar = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2"/>
  </svg>
);
const IconDots = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const IconWave = () => (
  <svg width="27" height="22" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M2 7v10M6 4v16M10 8v8M14 2v20M18 6v12M22 4v16M26 8v8M30 5v14"/>
  </svg>
);
const IconStackedFiles = () => (
  <svg width="92" height="58" viewBox="0 0 92 58" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="10" y="23" width="28" height="26" rx="5"/>
    <rect x="35" y="23" width="30" height="26" rx="5"/>
    <rect x="58" y="10" width="31" height="31" rx="5"/>
    <path d="M18 31h9M18 36h14M43 31h10M43 36h15M67 18h9M67 23h14M67 28h10"/>
    <path d="M74 34v14h14" strokeDasharray="2 2"/>
    <path d="M73 28v10M68 33h10"/>
  </svg>
);

const THINKING_PHASES = [
  "Reading your question…",
  "Searching knowledge base…",
  "Composing response…",
  "Refining answer…",
];

function formatRelativeTime(value) {
  if (!value) return "No messages yet";
  const diffSeconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diffSeconds < 60) return `Last message ${diffSeconds} second${diffSeconds === 1 ? "" : "s"} ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Last message ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Last message ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Last message ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function ProjectChatCard({ chat, onOpen, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(chat.id)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(chat.id);
        }
      }}
      style={{
        width: "100%",
        minHeight: "90px",
        background: "#121310",
        border: "1px solid transparent",
        borderRadius: "14px",
        color: "#eee5cf",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        padding: "20px 16px",
        textAlign: "left",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#2f302d"; e.currentTarget.style.background = "#151613"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "#121310"; }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "18px", fontWeight: 700, color: "#f1ead8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {chat.label || "Project Chat"}
        </span>
        <span style={{ display: "block", marginTop: "7px", fontSize: "15px", color: "#bdb6a4" }}>
          {formatRelativeTime(chat.updated_at)}
        </span>
      </span>
      <button
        title="Delete chat"
        onClick={e => { e.stopPropagation(); onDelete(chat.id); }}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onDelete(chat.id);
          }
        }}
        style={{ background: "none", border: "none", color: "#898982", cursor: "pointer", display: "flex", padding: "4px", flexShrink: 0 }}
      >
        <IconDots />
      </button>
    </div>
  );
}

function ProjectHome({
  project,
  loading,
  projectChats,
  input,
  setInput,
  inputRef,
  fileInputRef,
  imageInputRef,
  attachments,
  removeAttachment,
  handleSend,
  handleKeyDown,
  handlePaste,
  handleFileInput,
  handleImageInput,
  onOpenProjectChat,
  onDeleteProjectChat,
  isLoading,
  user,
  onRequireAuth,
}) {
  const description = project?.description?.trim();

  return (
    <div className="project-home" style={{
      width: "100%",
      maxWidth: "1460px",
      margin: "0 auto",
      padding: "3.25rem clamp(1rem, 3vw, 3rem)",
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 538px)",
      gap: "clamp(2rem, 4vw, 4.25rem)",
      alignItems: "start",
    }}>
      <section style={{ minWidth: 0 }}>
        <Link href="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#c7d2c3", textDecoration: "none", fontSize: "18px", marginBottom: "2.4rem" }}>
          <IconBack /> All projects
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.9rem" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: "0 0 0.65rem", fontSize: "clamp(2rem, 4vw, 3.05rem)", lineHeight: 1.08, fontWeight: 600, color: "#eee5cf", wordBreak: "break-word" }}>
              {loading ? "Loading project..." : project?.name || "Project not found"}
            </h1>
            <p style={{ margin: 0, color: "#d6d0bd", fontSize: "20px", lineHeight: 1.5, minHeight: "1.5em", wordBreak: "break-word" }}>
              {description || "Start a focused chat in this project."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "22px", color: "#eee5cf", flexShrink: 0 }}>
            <button title="Project options" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: "4px" }}><IconDots /></button>
            <button title="Favorite project" style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", padding: "4px" }}><IconStar /></button>
          </div>
        </div>

        <div style={{ background: "#292a28", border: "1px solid #4a4b47", borderRadius: "24px", minHeight: "154px", padding: "26px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 10px 30px rgba(0,0,0,0.14)" }}>
          {attachments.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
              {attachments.map(a => (
                <button key={a.id} onClick={() => removeAttachment(a.id)} title="Remove attachment" style={{ display: "inline-flex", alignItems: "center", gap: "7px", maxWidth: "210px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "#d6d0bd", padding: "7px 9px", cursor: "pointer", fontSize: "12px" }}>
                  <IconFile />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</span>
                  <IconClose />
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={inputRef}
            value={input}
            readOnly={!user}
            onFocus={() => { if (!user) onRequireAuth(); }}
            onChange={e => { if (user) setInput(e.target.value); }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={!user ? "Log in to start a project chat" : "How can I help you today?"}
            rows={1}
            style={{ width: "100%", minHeight: "48px", background: "none", border: "none", outline: "none", color: "#eee5cf", fontSize: "22px", fontFamily: "Georgia, serif", resize: "none", lineHeight: 1.45 }}
            onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }}
          />

          <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx,.csv,.md" style={{ display: "none" }} onChange={handleFileInput} />
          <input ref={imageInputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleImageInput} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginTop: "16px" }}>
            <button onClick={() => { if (!onRequireAuth()) return; fileInputRef.current?.click(); }} title="Attach files" style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", color: "#cfc8b7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconPlus />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "18px", color: "#cfc8b7" }}>
              <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px", fontWeight: 600 }}>Nexion AI</button>
              <button onClick={handleSend} disabled={isLoading || (user && !input.trim() && attachments.length === 0)} title="Send" style={{ background: "none", border: "none", color: (input.trim() || attachments.length > 0 || !user) && !isLoading ? "#e9e2d0" : "#8f8d87", cursor: !isLoading && (!user || input.trim() || attachments.length > 0) ? "pointer" : "default", display: "flex", alignItems: "center", padding: "2px" }}>
                <IconWave />
              </button>
            </div>
          </div>
        </div>

        {projectChats.length > 0 ? (
          <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {projectChats.map(chat => (
              <ProjectChatCard
                key={chat.id}
                chat={chat}
                onOpen={onOpenProjectChat}
                onDelete={onDeleteProjectChat}
              />
            ))}
          </div>
        ) : (
          <div style={{ marginTop: "28px", border: "1px solid #3b3c39", borderRadius: "14px", minHeight: "108px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#bdb6a4", fontSize: "18px", padding: "1.4rem" }}>
            Start a chat to keep conversations organized and re-use project knowledge.
          </div>
        )}
      </section>

      <aside style={{ marginTop: "3.6rem", border: "1px solid #3b3c39", borderRadius: "24px", overflow: "hidden", background: "#1b1c1a" }}>
        <div style={{ padding: "28px", display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", color: "#eee5cf", fontWeight: 600 }}>Instructions</h2>
            <p style={{ margin: 0, color: "#77736b", fontSize: "16px" }}>Add instructions to tailor Nexion&apos;s responses</p>
          </div>
          <button title="Add instructions" style={{ background: "none", border: "none", color: "#cfc8b7", cursor: "pointer", display: "flex", padding: "4px" }}><IconPlus /></button>
        </div>
        <div style={{ height: "1px", background: "#363733" }} />
        <div style={{ padding: "24px 28px 26px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "20px", color: "#eee5cf", fontWeight: 600 }}>Files</h2>
            <button onClick={() => { if (!onRequireAuth()) return; fileInputRef.current?.click(); }} title="Add files" style={{ background: "none", border: "none", color: "#cfc8b7", cursor: "pointer", display: "flex", padding: "4px" }}><IconPlus /></button>
          </div>
          <div style={{ minHeight: "200px", background: "#141512", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#bdb6a4", padding: "28px" }}>
            <div style={{ color: "#5f615c", marginBottom: "20px" }}><IconStackedFiles /></div>
            <p style={{ margin: 0, maxWidth: "310px", fontSize: "16px", lineHeight: 1.35 }}>Add PDFs, documents, or other text to reference in this project.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");
  const chatId = searchParams.get("chat");
  const { messages, isLoading, sendMessage, clearMessages, setMessages } = useNexionChat();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [materialOpen, setMaterialOpen] = useState(false);
  const [materialContent, setMaterialContent] = useState("");

  // Auth — driven entirely by supabase.auth.onAuthStateChange
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectChats, setProjectChats] = useState([]);

  const [thinkingPhase, setThinkingPhase] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [attachments, setAttachments] = useState([]);
  const [plusOpen, setPlusOpen] = useState(false);

  // ── Build a plain user object from a Supabase session ──────
  function userFromSession(session) {
    const sessionUser = session?.user;
    if (!sessionUser) return null;
    const metadata = sessionUser.user_metadata || {};
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: metadata.full_name || metadata.name || sessionUser.email || "User",
      avatarUrl: metadata.avatar_url,
      plan: "Free plan",
    };
  }

  function createChatLabel(requestText) {
    const normalized = requestText.replace(/\s+/g, " ").trim();
    if (!normalized) return "New Chat";
    return normalized.slice(0, 60) + (normalized.length > 60 ? "…" : "");
  }

  // ── Supabase auth listener ─────────────────────────────────
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(userFromSession(data.session));
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(userFromSession(session));
      if (session) setAuthModalOpen(false);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ── Chat persistence hook ──────────────────────────────────
  const {
    recents,
    loadChat,
    saveMessage,
    startNewChat,
    toggleFavorite,
    renameChat,
    deleteChat,
  } = useChats(user?.id ?? null, projectId);

  useEffect(() => {
    startNewChat();
    clearMessages();
    setMaterialOpen(false);
    setMaterialContent("");
    setAttachments([]);
    setInput("");
    // Only reset the workspace when the selected project changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !user?.id) {
      setProject(null);
      setProjectLoading(false);
      return;
    }

    let mounted = true;
    setProjectLoading(true);
    supabase
      .from("projects")
      .select("id, name, description")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!mounted) return;
        setProject(error ? null : data);
        setProjectLoading(false);
      });

    return () => { mounted = false; };
  }, [projectId, user?.id]);

  const fetchProjectChats = useCallback(async () => {
    if (!projectId || !user?.id) {
      setProjectChats([]);
      return;
    }

    const { data, error } = await supabase
      .from("chats")
      .select("id, label, favorited, project_id, updated_at")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!error && data) setProjectChats(data);
  }, [projectId, user?.id]);

  useEffect(() => {
    fetchProjectChats();
  }, [fetchProjectChats]);

  function requireAuth() {
    if (user) return true;
    setAuthModalOpen(true);
    return false;
  }

  // ── Scroll to bottom on new messages ──────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Thinking phase cycling ─────────────────────────────────
  useEffect(() => {
    if (!isLoading) { setThinkingPhase(0); return; }
    const interval = setInterval(() => {
      setThinkingPhase(p => (p + 1) % THINKING_PHASES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  // ── Auto-open MaterialPanel for long responses ─────────────
  useEffect(() => {
    if (messages.length === 0) {
      setMaterialOpen(false);
      setMaterialContent("");
      return;
    }
    const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
    if (lastAssistant && isMaterial(lastAssistant.content)) {
      setMaterialContent(lastAssistant.content);
      setMaterialOpen(true);
    }
  }, [messages]);

  // ── Page title ────────────────────────────────────────────
  useEffect(() => {
    const firstUser = messages.find(m => m.role === "user");
    if (firstUser) {
      document.title = `${firstUser.content.trim().slice(0, 50)} — Nexion`;
    } else if (project?.name) {
      document.title = `${project.name} - Nexion`;
    } else {
      document.title = "Nexion";
    }
  }, [messages, project?.name]);

  // ── Close attach dropdown on outside click ────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setPlusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!chatId || !user?.id) return;

    let mounted = true;
    loadChat(chatId).then(pastMessages => {
      if (!mounted || pastMessages.length === 0) return;
      setMessages(pastMessages);
      setMaterialOpen(false);
      setMaterialContent("");
    });

    return () => { mounted = false; };
  }, [chatId, user?.id, loadChat, setMessages]);

  // ── Load a past chat from the sidebar ─────────────────────
  async function handleLoadChat(chatId) {
    if (!requireAuth()) return;
    const pastMessages = await loadChat(chatId);
    if (pastMessages.length > 0) {
      setMessages(pastMessages); // replace current messages
      setMaterialOpen(false);
      setMaterialContent("");
    }
  }

  async function handleDeleteProjectChat(chatId) {
    if (!requireAuth()) return;
    await deleteChat(chatId);
    setProjectChats(prev => prev.filter(chat => chat.id !== chatId));
    if (messages.length > 0) {
      clearMessages();
      setMaterialOpen(false);
      setMaterialContent("");
    }
    await fetchProjectChats();
  }

  async function handleRenameChat(chatId, newLabel) {
    await renameChat(chatId, newLabel);
    setProjectChats(prev => prev.map(chat => chat.id === chatId ? { ...chat, label: newLabel } : chat));
  }

  async function handleDeleteChat(chatId) {
    await deleteChat(chatId);
    setProjectChats(prev => prev.filter(chat => chat.id !== chatId));
  }

  // ── Send a message + persist both turns ───────────────────
  async function handleSend() {
    const trimmed = input.trim();
    if (isLoading) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!trimmed && attachments.length === 0) return;
    setInput("");

    const userContent = trimmed || `[Attached: ${attachments.map(a => a.name).join(", ")}]`;

    // Derive chat label from first user message (truncated)
    const isFirstMessage = messages.length === 0;
    const chatLabel = createChatLabel(userContent);

    // Save user message first
    if (isFirstMessage) {
      await saveMessage("user", userContent, chatLabel);
    } else {
      await saveMessage("user", userContent);
    }
    if (projectId) await fetchProjectChats();

    // ── Build file context to inject into the AI prompt ───────
    let fileContext = undefined;
    if (attachments.length > 0) {
      const fileTexts = await Promise.all(
        attachments.map(async (a) => {
          if (a.kind === "image") {
            return `[Attached image: ${a.name}]`;
          }
          // Decode base64 dataUrl to plain text for readable file types
          try {
            const base64 = a.dataUrl.split(",")[1];
            const decoded = atob(base64);
            const isReadable = /^[\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]*$/.test(decoded.slice(0, 500));
            if (isReadable) {
              return `[File: ${a.name}]\n${decoded}`;
            } else {
              return `[Attached binary file: ${a.name} (${a.type})]`;
            }
          } catch {
            return `[Attached file: ${a.name}]`;
          }
        })
      );
      fileContext = { pdfText: fileTexts.join("\n\n---\n\n") };
    }

    // Send to AI
    const reply = await sendMessage(userContent, fileContext);

    // Save assistant reply
    if (reply) {
      await saveMessage("assistant", reply);
    }

    setAttachments([]);
    if (projectId) await fetchProjectChats();
  }

  // ── New chat ───────────────────────────────────────────────
  function handleNewChat() {
    if (!requireAuth()) return;
    startNewChat();
    clearMessages();
    setMaterialOpen(false);
    setMaterialContent("");
    setAttachments([]);
    setInput("");
    if (projectId) fetchProjectChats();
  }

  // ── Logout ────────────────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut();
    startNewChat();
    clearMessages();
    setMaterialOpen(false);
    setMaterialContent("");
  }

  function handleKeyDown(e) {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── File attachments ──────────────────────────────────────
  function readFileAsDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  async function addFiles(files, kind) {
    const newItems = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      newItems.push({ id: Date.now() + Math.random(), name: file.name, type: file.type, size: file.size, dataUrl, kind });
    }
    setAttachments(prev => [...prev, ...newItems]);
    setPlusOpen(false);
  }

  function handleFileInput(e) {
    if (!requireAuth()) {
      e.target.value = "";
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files, "file");
    e.target.value = "";
  }

  function handleImageInput(e) {
    if (!requireAuth()) {
      e.target.value = "";
      return;
    }
    const files = Array.from(e.target.files || []);
    if (files.length) addFiles(files, "image");
    e.target.value = "";
  }

  function removeAttachment(id) {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }

  function handlePaste(e) {
    if (!user) {
      e.preventDefault();
      setAuthModalOpen(true);
      return;
    }
    const items = Array.from(e.clipboardData?.items || []);
    const pasteFiles = items
      .filter(item => item.kind === "file")
      .map(item => item.getAsFile())
      .filter(Boolean);
    if (pasteFiles.length) {
      e.preventDefault();
      pasteFiles.forEach(file => {
        const kind = file.type.startsWith("image/") ? "image" : "file";
        addFiles([file], kind);
      });
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#060a10", color: "#e2e8f0", fontFamily: "Georgia, serif", overflow: "hidden", animation: "fadeInHard 0.3s ease-in-out" }}>

      <Sidebar
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        recents={recents}
        onToggleFavorite={toggleFavorite}
        onSend={handleLoadChat}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        user={user}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        <div style={{ flex: 1, overflowY: "auto", padding: isEmpty ? "0" : "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {isEmpty && projectId && (
            <ProjectHome
              project={project}
              loading={projectLoading}
              projectChats={projectChats}
              input={input}
              setInput={setInput}
              inputRef={inputRef}
              fileInputRef={fileInputRef}
              imageInputRef={imageInputRef}
              attachments={attachments}
              removeAttachment={removeAttachment}
              handleSend={handleSend}
              handleKeyDown={handleKeyDown}
              handlePaste={handlePaste}
              handleFileInput={handleFileInput}
              handleImageInput={handleImageInput}
              onOpenProjectChat={handleLoadChat}
              onDeleteProjectChat={handleDeleteProjectChat}
              isLoading={isLoading}
              user={user}
              onRequireAuth={requireAuth}
            />
          )}

          {isEmpty && !projectId && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "3rem 2rem" }}>
              <div style={{ fontSize: "32px", marginBottom: "1.5rem", fontFamily: "monospace", color: "#1d4ed8" }}>◈</div>
              <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: "400", letterSpacing: "-0.02em", marginBottom: "1rem", color: "#e2e8f0" }}>
                What are you <span style={{ fontStyle: "italic", color: "#60a5fa" }}>researching?</span>
              </h1>
              <p style={{ fontSize: "14px", color: "#334155", maxWidth: "400px", lineHeight: "1.8", marginBottom: "2.5rem" }}>
                Send your first thesis question to start a saved chat session.
              </p>
            </div>
          )}

          {!isEmpty && (
            <div style={{ width: "100%", maxWidth: "700px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: "12px", alignItems: "flex-start", animation: `fadeInUp 0.3s ease-out ${i * 50}ms both` }}>
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                    background: m.role === "user" ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    border: m.role === "user" ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontFamily: "monospace",
                    color: m.role === "user" ? "#60a5fa" : "#475569",
                  }}>{m.role === "user" ? "U" : "N"}</div>

                  <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{
                      background: m.role === "user" ? "rgba(29,78,216,0.15)" : "rgba(255,255,255,0.03)",
                      border: m.role === "user" ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      padding: "12px 16px", fontSize: "14px", lineHeight: "1.8",
                      color: m.role === "user" ? "#bfdbfe" : "#cbd5e1",
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>{m.content}</div>

                    {m.role === "assistant" && isMaterial(m.content) && (
                      <button
                        onClick={() => { setMaterialContent(m.content); setMaterialOpen(true); }}
                        style={{
                          alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "5px",
                          background: "none", border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
                          color: "#475569", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.04em", transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#60a5fa"; e.currentTarget.style.borderColor = "rgba(96,165,250,0.3)"; e.currentTarget.style.background = "rgba(96,165,250,0.05)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "none"; }}
                      >
                        <IconDocument /> VIEW MATERIAL
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontFamily: "monospace", color: "#475569", flexShrink: 0 }}>N</div>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3b82f6", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                    <span key={thinkingPhase} style={{ fontSize: "12px", color: "#475569", fontFamily: "monospace", letterSpacing: "0.03em", animation: "fadePhase 0.35s ease" }}>
                      {THINKING_PHASES[thinkingPhase]}
                    </span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {!(isEmpty && projectId) && (
        <div style={{ flexShrink: 0, padding: "1rem 1.5rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#060a10" }}>
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", overflow: "visible", position: "relative" }}>

              {attachments.length > 0 && (
                <div style={{ padding: "10px 12px 0", display: "flex", flexWrap: "wrap", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "10px", animation: "slideDown 0.2s ease-out" }}>
                  {attachments.map((a, idx) => (
                    <div key={a.id} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, animation: `slideInLeft 0.2s ease-out ${idx * 50}ms both`, cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; e.currentTarget.style.boxShadow = "0 0 8px rgba(59,130,246,0.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                      onClick={() => {
                        if (a.kind === "image") {
                          setMaterialContent(`<img src="${a.dataUrl}" alt="${a.name}" style="max-width: 100%; height: auto;" />`);
                        } else {
                          setMaterialContent(`FILE: ${a.name}\n\nType: ${a.type}\nSize: ${(a.size / 1024).toFixed(2)} KB`);
                        }
                        setMaterialOpen(true);
                      }}>
                      {a.kind === "image" ? (
                        <div style={{ position: "relative", width: "72px", height: "72px" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={a.dataUrl} alt={a.name} style={{ width: "72px", height: "72px", objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", padding: "2px 5px", fontSize: "9px", fontFamily: "monospace", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                          <button onClick={(e) => { e.stopPropagation(); removeAttachment(a.id); }} style={{ position: "absolute", top: "3px", right: "3px", width: "16px", height: "16px", borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", padding: 0 }}><IconClose /></button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px 6px 8px", background: "rgba(255,255,255,0.04)", maxWidth: "180px" }}>
                          <span style={{ color: "#60a5fa", flexShrink: 0, display: "flex" }}><IconFile /></span>
                          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#93c5fd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{a.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); removeAttachment(a.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: "1px", flexShrink: 0, transition: "color 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
                            onMouseLeave={e => e.currentTarget.style.color = "#475569"}
                          ><IconClose /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", padding: "10px 12px" }}>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx,.csv,.md" style={{ display: "none" }} onChange={handleFileInput} />
                <input ref={imageInputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleImageInput} />

                <div ref={dropdownRef} style={{ position: "relative", flexShrink: 0, zIndex: 100 }}>
                  <button onClick={() => { if (!requireAuth()) return; setPlusOpen(p => !p); }} title="Attach image or file"
                    style={{ width: "34px", height: "34px", borderRadius: "8px", background: plusOpen ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)", border: plusOpen ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: plusOpen ? "#60a5fa" : "#475569", transition: "all 0.15s", transform: plusOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    onMouseEnter={e => { if (!plusOpen) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#94a3b8"; }}}
                    onMouseLeave={e => { if (!plusOpen) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#475569"; }}}
                  >
                    <IconPlus />
                  </button>

                  {plusOpen && (
                    <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "0", background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: "175px", zIndex: 9999, animation: "slideUpSmooth 0.2s cubic-bezier(0.34,1.4,0.64,1)" }}>
                      <button
                        onClick={() => {
                          if (!requireAuth()) return;
                          const input = document.createElement("input");
                          input.type = "file";
                          input.multiple = true;
                          input.accept = "image/*,.pdf,.txt,.doc,.docx,.csv,.md";
                          input.onchange = (e) => {
                            const files = Array.from(e.target.files || []);
                            const imageFiles = files.filter(f => f.type.startsWith("image/"));
                            const otherFiles = files.filter(f => !f.type.startsWith("image/"));
                            if (imageFiles.length) addFiles(imageFiles, "image");
                            if (otherFiles.length) addFiles(otherFiles, "file");
                            setPlusOpen(false);
                          };
                          input.click();
                        }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "13px", fontFamily: "Georgia, serif", textAlign: "left", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e2e8f0"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span>Attach Image/File</span>
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  ref={inputRef}
                  value={input}
                  readOnly={!user}
                  onFocus={() => { if (!user) setAuthModalOpen(true); }}
                  onChange={e => { if (user) setInput(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={!user ? "Log in to save chats and continue" : attachments.length > 0 ? "Add a message or just send…" : "Ask about your thesis…"}
                  rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: "14px", fontFamily: "Georgia, serif", lineHeight: "1.6", resize: "none", maxHeight: "140px", overflowY: "auto" }}
                  onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
                />
                <button onClick={handleSend} disabled={isLoading || (user && !input.trim() && attachments.length === 0)}
                  style={{ width: "34px", height: "34px", borderRadius: "8px", background: (input.trim() || attachments.length > 0 || !user) && !isLoading ? "#1d4ed8" : "rgba(255,255,255,0.05)", border: "none", cursor: !isLoading && (!user || input.trim() || attachments.length > 0) ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s", fontSize: "16px", color: (input.trim() || attachments.length > 0 || !user) && !isLoading ? "#fff" : "#334155" }}
                >↑</button>
              </div>
            </div>

            <p style={{ textAlign: "center", fontSize: "11px", color: "#475569", marginTop: "12px", fontFamily: "monospace", letterSpacing: "0.05em" }}>NEXION · THESIS AI</p>
          </div>
        </div>
        )}
      </div>

      <MaterialPanel open={materialOpen} content={materialContent} onClose={() => setMaterialOpen(false)} />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadePhase { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInHard { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;max-height:0;transform:translateY(-10px)} to{opacity:1;max-height:500px;transform:translateY(0)} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideUpSmooth { from{opacity:0;transform:translateY(-10px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        @media (max-width: 980px) {
          .project-home {
            grid-template-columns: 1fr !important;
            padding-top: 2rem !important;
          }
          .project-home aside {
            margin-top: 0 !important;
          }
        }
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        textarea::placeholder,input::placeholder{color:#64748b;opacity:1}
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}
