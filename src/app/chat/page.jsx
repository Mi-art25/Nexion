"use client";

import { useNexionChat } from "@/hooks/useNexionChat";
import { useChats } from "@/hooks/useChats";
import { useState, useEffect } from "react";
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

const THINKING_PHASES = [
  "Reading your question…",
  "Searching knowledge base…",
  "Composing response…",
  "Refining answer…",
];

export default function ChatPage() {
  const { messages, isLoading, sendMessage, clearMessages, setMessages } = useNexionChat();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [materialOpen, setMaterialOpen] = useState(false);
  const [materialContent, setMaterialContent] = useState("");

  // Auth — driven entirely by supabase.auth.onAuthStateChange
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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
  } = useChats(user?.id ?? null);

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
    } else {
      document.title = "Nexion";
    }
  }, [messages]);

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

    const pdfAttachment = attachments.find(a => a.type === "application/pdf");
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

    // Send to AI
    const reply = await sendMessage(
      userContent,
      pdfAttachment ? { pdfText: `[Attached PDF: ${pdfAttachment.name}]\n${pdfAttachment.dataUrl}` } : undefined
    );

    // Save assistant reply
    if (reply) {
      await saveMessage("assistant", reply);
    }

    setAttachments([]);
  }

  // ── New chat ───────────────────────────────────────────────
  function handleNewChat() {
    if (!requireAuth()) return;
    startNewChat();
    clearMessages();
    setMaterialOpen(false);
    setMaterialContent("");
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
        onRenameChat={renameChat}
        onDeleteChat={deleteChat}
        user={user}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        <div style={{ flex: 1, overflowY: "auto", padding: isEmpty ? "0" : "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {isEmpty && (
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
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        textarea::placeholder,input::placeholder{color:#64748b;opacity:1}
      `}</style>
    </div>
  );
}
