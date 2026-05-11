"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l2 3h8a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline rename state: { id, name }
  const [editing, setEditing] = useState(null);

  // ── Get current user ───────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Fetch projects for this user ───────────────────────────
  const fetchProjects = useCallback(async () => {
    if (!userId) { setProjects([]); setLoading(false); return; }
    setLoading(true);
    setError("");
    const { data, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Failed to load projects. Make sure the projects table exists in Supabase.");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Create ─────────────────────────────────────────────────
  async function addProject() {
    if (!newProjectName.trim()) return;
    if (!userId) { setError("You must be logged in to create projects."); return; }
    setSaving(true);
    setError("");
    const { data, error: insertError } = await supabase
      .from("projects")
      .insert([{ name: newProjectName.trim(), user_id: userId }])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      setProjects(prev => [data, ...prev]);
      setNewProjectName("");
      setShowNewProject(false);
    }
    setSaving(false);
  }

  // ── Rename ─────────────────────────────────────────────────
  async function saveRename(id) {
    if (!editing?.name.trim()) { setEditing(null); return; }
    const { error: updateError } = await supabase
      .from("projects")
      .update({ name: editing.name.trim(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editing.name.trim() } : p));
    }
    setEditing(null);
  }

  // ── Delete ─────────────────────────────────────────────────
  async function deleteProject(id) {
    const { error: deleteError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  }

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    padding: "1.5rem",
    transition: "all 0.15s",
    position: "relative",
  };

  return (
    <div style={{ height: "100vh", background: "#060a10", color: "#e2e8f0", fontFamily: "Georgia, serif", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/chat"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", color: "#475569", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "none"; }}
          >
            <IconBack />
          </Link>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "600", margin: 0 }}>Projects</h1>
            <p style={{ fontSize: "12px", color: "#475569", margin: 0, marginTop: "4px" }}>Manage your research projects</p>
          </div>
        </div>

        <button onClick={() => setShowNewProject(!showNewProject)}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1d4ed8", border: "none", color: "#fff", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia, serif", transition: "background 0.15s", fontWeight: "500" }}
          onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
          onMouseLeave={e => e.currentTarget.style.background = "#1d4ed8"}
        >
          <IconPlus /> New Project
        </button>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

          {/* Error banner */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", marginBottom: "1.5rem", fontSize: "13px", color: "#fca5a5", fontFamily: "Georgia, serif" }}>
              {error}
            </div>
          )}

          {/* Not logged in */}
          {!userId && !loading && (
            <div style={{ textAlign: "center", padding: "3rem 2rem", color: "#475569" }}>
              <p style={{ fontSize: "16px", fontFamily: "Georgia, serif" }}>Sign in to view and manage your projects.</p>
              <Link href="/chat" style={{ color: "#60a5fa", fontFamily: "Georgia, serif", fontSize: "14px" }}>← Back to chat</Link>
            </div>
          )}

          {/* New project form */}
          {showNewProject && userId && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", marginTop: 0, marginBottom: "1rem", color: "#e2e8f0" }}>Create New Project</h3>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  type="text" placeholder="Project name…" value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addProject()}
                  autoFocus
                  style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", color: "#e2e8f0", fontSize: "14px", fontFamily: "Georgia, serif", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <button onClick={addProject} disabled={!newProjectName.trim() || saving}
                  style={{ background: "#1d4ed8", border: "none", color: "#fff", padding: "12px 24px", borderRadius: "8px", cursor: newProjectName.trim() ? "pointer" : "not-allowed", fontSize: "14px", fontFamily: "Georgia, serif", transition: "background 0.15s", opacity: newProjectName.trim() ? 1 : 0.5 }}
                  onMouseEnter={e => { if (newProjectName.trim()) e.currentTarget.style.background = "#1e40af"; }}
                  onMouseLeave={e => { if (newProjectName.trim()) e.currentTarget.style.background = "#1d4ed8"; }}
                >
                  {saving ? "Creating…" : "Create"}
                </button>
                <button onClick={() => { setShowNewProject(false); setNewProjectName(""); }}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia, serif", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#e2e8f0"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
                >Cancel</button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: "center", padding: "3rem", color: "#475569", fontFamily: "monospace", fontSize: "13px" }}>
              Loading projects…
            </div>
          )}

          {/* Empty state */}
          {!loading && userId && projects.length === 0 && !showNewProject && (
            <div style={{ textAlign: "center", padding: "3rem 2rem", color: "#475569" }}>
              <p style={{ fontSize: "16px", marginBottom: "1rem", fontFamily: "Georgia, serif" }}>No projects yet</p>
              <p style={{ fontSize: "13px", marginBottom: "2rem", fontFamily: "Georgia, serif" }}>Create your first project to get started</p>
              <button onClick={() => setShowNewProject(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#1d4ed8", border: "none", color: "#fff", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia, serif", fontWeight: "500" }}
                onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
                onMouseLeave={e => e.currentTarget.style.background = "#1d4ed8"}
              >
                <IconPlus /> Create Project
              </button>
            </div>
          )}

          {/* Projects grid */}
          {!loading && projects.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {projects.map(project => (
                <div key={project.id} style={cardStyle}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.background = "rgba(255,255,255,0.045)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                >
                  <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#60a5fa", flexShrink: 0 }}>
                        <IconFolder />
                      </div>

                      {/* Inline rename or title */}
                      {editing?.id === project.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                          <input
                            type="text" value={editing.name}
                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                            onKeyDown={e => { if (e.key === "Enter") saveRename(project.id); if (e.key === "Escape") setEditing(null); }}
                            autoFocus
                            style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: "6px", padding: "4px 8px", color: "#e2e8f0", fontSize: "14px", fontFamily: "Georgia, serif", outline: "none" }}
                          />
                          <button onClick={() => saveRename(project.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e", display: "flex", padding: "3px" }}><IconCheck /></button>
                          <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", padding: "3px" }}><IconX /></button>
                        </div>
                      ) : (
                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.name}</h3>
                      )}
                    </div>

                    {editing?.id !== project.id && (
                      <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                        <button
                          onClick={() => setEditing({ id: project.id, name: project.name })}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
                        ><IconEdit /></button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          style={{ width: "32px", height: "32px", borderRadius: "6px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                        ><IconTrash /></button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", fontFamily: "monospace" }}>
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    <span>Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}