"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useChats } from "@/hooks/useChats";
import Sidebar from "@/app/chat/Sidebar";

// ─── Icons ────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconFolder = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
);
const IconChat = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 0 2 2z"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

// ─── Shared nav ───────────────────────────────────────────────
// ─── Create / Edit modal ──────────────────────────────────────
function ProjectModal({ open, onClose, onSave, initial = null }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setName(initial?.name || ""); setDescription(initial?.description || ""); setError(""); }
  }, [open, initial]);

  async function handleSave() {
    if (!name.trim()) { setError("Project name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save project.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#0a0f1a", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px", padding: "2rem", maxWidth: "420px", width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "500", color: "#e2e8f0", fontFamily: "Georgia, serif", margin: 0 }}>
            {initial ? "Rename project" : "New project"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
            onMouseLeave={e => e.currentTarget.style.color = "#475569"}
          ><IconClose /></button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#f87171", marginBottom: "1rem", fontFamily: "Georgia, serif" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            autoFocus
            type="text"
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", padding: "11px 14px", color: "#e2e8f0",
              fontSize: "14px", fontFamily: "Georgia, serif", outline: "none",
            }}
            onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          {!initial && (
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", padding: "11px 14px", color: "#e2e8f0",
                fontSize: "13px", fontFamily: "Georgia, serif", outline: "none",
                resize: "none", lineHeight: "1.6",
              }}
              onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#1d4ed8", color: "#fff", border: "none",
              borderRadius: "8px", padding: "11px", fontSize: "14px",
              fontFamily: "Georgia, serif", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1, fontWeight: "500", marginTop: "4px",
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#1e40af"; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#1d4ed8"; }}
          >
            {saving ? "Saving…" : initial ? "Save changes" : "Create project"}
          </button>
        </div>
      </div>
      <style>{`.project-modal-input::placeholder{color:#475569}`}</style>
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────
function ProjectCard({ project, onOpen }) {
  const chatCount = project.chat_count ?? 0;
  const updatedAt = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        padding: "1.25rem",
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        position: "relative",
        display: "flex", flexDirection: "column", gap: "12px",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)"; e.currentTarget.style.background = "rgba(59,130,246,0.03)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onClick={() => onOpen(project.id)}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#3b82f6", flexShrink: 0,
          }}>
            <IconFolder />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: "14px", color: "#e2e8f0", fontFamily: "Georgia, serif",
              fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {project.name}
            </div>
            {project.description && (
              <div style={{
                fontSize: "12px", color: "#334155", fontFamily: "Georgia, serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px",
              }}>
                {project.description}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#334155", fontSize: "11px", fontFamily: "monospace" }}>
          <IconChat />
          <span>{chatCount} chat{chatCount !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ fontSize: "11px", color: "#1e293b", fontFamily: "monospace" }}>
          Updated {updatedAt}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState({ onCreateClick }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "5rem 2rem", textAlign: "center",
    }}>
      <div style={{
        width: "52px", height: "52px", borderRadius: "14px",
        background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3b82f6", marginBottom: "1.25rem",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
      </div>
      <h3 style={{ fontSize: "16px", fontWeight: "500", color: "#64748b", fontFamily: "Georgia, serif", marginBottom: "0.5rem" }}>
        No projects yet
      </h3>
      <p style={{ fontSize: "13px", color: "#334155", fontFamily: "Georgia, serif", marginBottom: "1.5rem", lineHeight: "1.7", maxWidth: "300px" }}>
        Group your thesis chats and documents into projects to stay organized.
      </p>
      <button
        onClick={onCreateClick}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#1d4ed8", color: "#fff", border: "none",
          borderRadius: "8px", padding: "10px 18px", fontSize: "13px",
          fontFamily: "Georgia, serif", cursor: "pointer",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
        onMouseLeave={e => e.currentTarget.style.background = "#1d4ed8"}
      >
        <IconPlus /> New project
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    recents,
    toggleFavorite,
    renameChat,
    deleteChat,
  } = useChats(user?.id ?? null);

  // ── Auth check ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/chat"); return; }
      const u = session.user;
      setUser({
        id: u.id,
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User",
        email: u.email,
      });
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/chat");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  // ── Load projects ──
  const loadProjects = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error || !data) return;

    const projectIds = data.map(project => project.id);
    let countsByProject = {};

    if (projectIds.length > 0) {
      const { data: chats } = await supabase
        .from("chats")
        .select("project_id")
        .eq("user_id", user.id)
        .in("project_id", projectIds);

      countsByProject = (chats || []).reduce((counts, chat) => {
        if (!chat.project_id) return counts;
        counts[chat.project_id] = (counts[chat.project_id] || 0) + 1;
        return counts;
      }, {});
    }

    setProjects(data.map(project => ({
      ...project,
      chat_count: countsByProject[project.id] || 0,
    })));
  }, [user?.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreate({ name, description }) {
    const { data, error } = await supabase
      .from("projects")
      .insert([{ user_id: user.id, name, description }])
      .select("id, name, description, updated_at")
      .single();
    if (error) throw error;
    setProjects(prev => [{ ...data, chat_count: 0 }, ...prev]);
  }

  async function handleRename({ name }) {
    const { error } = await supabase
      .from("projects")
      .update({ name })
      .eq("id", editingProject.id)
      .eq("user_id", user.id);
    if (error) throw error;
    setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, name } : p));
  }

  function handleOpenProject(id) {
    router.push(`/chat?project=${id}`);
  }

  function handleNewChat() {
    router.push("/chat");
  }

  function handleLoadChat(id) {
    router.push(`/chat?chat=${id}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/chat");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#060a10", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6",
              display: "inline-block", animation: "pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}
      `}</style>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", background: "#060a10", color: "#e2e8f0", display: "flex", overflow: "hidden" }}>
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
        user={user ? { ...user, plan: "Free plan" } : null}
        onLoginClick={() => router.push("/chat")}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, maxWidth: "900px", margin: "0 auto", width: "100%", padding: "2.5rem 1.5rem", overflowY: "auto" }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 1.9rem)", fontWeight: "400", letterSpacing: "-0.02em", fontFamily: "Georgia, serif", color: "#e2e8f0", margin: 0 }}>
              Your{" "}
              <span style={{ fontStyle: "italic", color: "#60a5fa" }}>projects</span>
            </h1>
            <p style={{ fontSize: "13px", color: "#334155", fontFamily: "Georgia, serif", marginTop: "6px", lineHeight: "1.6" }}>
              Organize your thesis research into focused workspaces.
            </p>
          </div>
          {projects.length > 0 && (
            <button
              onClick={() => { setEditingProject(null); setModalOpen(true); }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "#1d4ed8", color: "#fff", border: "none",
                borderRadius: "8px", padding: "9px 16px", fontSize: "13px",
                fontFamily: "Georgia, serif", cursor: "pointer", flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
              onMouseLeave={e => e.currentTarget.style.background = "#1d4ed8"}
            >
              <IconPlus /> New project
            </button>
          )}
        </div>

        {/* Grid or empty */}
        {projects.length === 0 ? (
          <EmptyState onCreateClick={() => { setEditingProject(null); setModalOpen(true); }} />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}>
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpenProject}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / rename modal */}
      <ProjectModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProject(null); }}
        onSave={editingProject ? handleRename : handleCreate}
        initial={editingProject}
      />

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        textarea::placeholder, input::placeholder { color: #334155; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}
