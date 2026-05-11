"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// ── Constants ────────────────────────────────────────────────────────────────
const RESEARCHER_TYPES = [
  "Undergraduate Student",
  "Graduate Student (Master's)",
  "PhD Candidate",
  "Postdoctoral Researcher",
  "Academic Faculty",
  "Independent Researcher",
  "Industry Researcher",
  "Data Scientist",
  "Journalist / Investigative Writer",
  "Policy Analyst",
  "Other",
];

const FONT_OPTIONS = [
  { label: "System Default",  value: "system-ui, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Arial",           value: "Arial, Helvetica, sans-serif" },
];

const APPEARANCE_OPTIONS = [
  { value: "dynamic", label: "Dynamic", icon: "✦" },
  { value: "dark",    label: "Night",   icon: "◐" },
  { value: "light",   label: "Light",   icon: "○" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const parseDevice = (ua = "") => {
  if (ua.includes("iPhone"))  return "Safari · iPhone";
  if (ua.includes("Android")) return "Chrome · Android";
  if (ua.includes("Mac"))     return "Safari · macOS";
  if (ua.includes("Windows")) return "Chrome · Windows";
  if (ua.includes("Linux"))   return "Firefox · Linux";
  return "Unknown browser";
};

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : "—";

// ── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const fileRef  = useRef(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("general");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState(null); // { type: "success"|"error", text: string }

  // ── Data state ───────────────────────────────────────────────────────────
  const [user,     setUser]     = useState(null);
  const [sessions, setSessions] = useState([]);

  // ── Profile fields ───────────────────────────────────────────────────────
  const [avatar,         setAvatar]         = useState(null);   // preview URL
  const [avatarFile,     setAvatarFile]     = useState(null);   // pending File
  const [avatarRemoved,  setAvatarRemoved]  = useState(false);  // flag: user hit "Remove"
  const [fullName,       setFullName]       = useState("");
  const [nickname,       setNickname]       = useState("");
  const [researcherType, setResearcherType] = useState("");
  const [appearance,     setAppearance]     = useState("dynamic");
  const [chatFont,       setChatFont]       = useState("system-ui, sans-serif");

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = useCallback((type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Load user + profile ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // 1. Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        window.location.href = "/login";
        return;
      }
      setUser(user);

      // 2. Load profile row (created automatically on signup via DB trigger)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 = row not found; anything else is a real error
        showToast("error", "Failed to load profile.");
      }

      if (profile) {
        setFullName(profile.full_name       || "");
        setNickname(profile.nickname        || "");
        setResearcherType(profile.researcher_type || "");
        setAppearance(profile.appearance    || "dynamic");
        setChatFont(profile.chat_font       || "system-ui, sans-serif");
        if (profile.avatar_url) setAvatar(profile.avatar_url);
      }

      // 3. Build current-session info from live session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessions([{
          id:         "current",
          user_agent: navigator.userAgent,
          created_at: new Date((session.expires_at - 3600) * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          current:    true,
        }]);
      }

      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Avatar: pick file ────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be under 2 MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarRemoved(false);
    setAvatar(URL.createObjectURL(file));
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";
  };

  // ── Avatar: remove ───────────────────────────────────────────────────────
  const handleRemoveAvatar = () => {
    setAvatar(null);
    setAvatarFile(null);
    setAvatarRemoved(true);
  };

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      let avatar_url = avatar && !avatarFile && !avatarRemoved ? avatar : null;

      // Upload new avatar if one was selected
      if (avatarFile) {
        const ext  = avatarFile.name.split(".").pop().toLowerCase();
        const path = `${user.id}/avatar.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);

        // Cache-bust so the browser shows the new image immediately
        avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
        setAvatar(avatar_url);
        setAvatarFile(null);
      }

      // If the user removed their avatar, clean up storage (best-effort)
      if (avatarRemoved) {
        const exts = ["jpg", "jpeg", "png", "webp", "gif"];
        await supabase.storage
          .from("avatars")
          .remove(exts.map((e) => `${user.id}/avatar.${e}`));
        setAvatarRemoved(false);
      }

      // Upsert the profile row
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id:              user.id,
            full_name:       fullName.trim(),
            nickname:        nickname.trim(),
            researcher_type: researcherType,
            appearance,
            chat_font:       chatFont,
            avatar_url,      // null clears it; a URL sets it
            updated_at:      new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (upsertError) throw upsertError;

      showToast("success", "Changes saved successfully.");
    } catch (err) {
      showToast("error", err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast("error", "Logout failed. Please try again.");
      setLoggingOut(false);
      return;
    }
    window.location.href = "/";
  };

  // ── Delete account ───────────────────────────────────────────────────────
  // Requires src/app/api/account/delete/route.js (service-role key, server-side only)
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Server error.");
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      showToast("error", err.message);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ── Revoke session ───────────────────────────────────────────────────────
  const handleRevokeSession = async (id) => {
    const res = await fetch(`/api/account/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } else {
      showToast("error", "Failed to revoke session.");
    }
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  if (loading) return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#0d0e11", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 32, height: 32,
        border: "2px solid #1e2029", borderTopColor: "#c9a96e",
        borderRadius: "50%", animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="sr">

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className="sb">
        <div className="sb-logo">
          <span className="lm">N</span>
          <span className="lt">Nexion</span>
        </div>

        <nav className="tn">
          <button
            className={`tb ${activeTab === "general" ? "act" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <span>⊞</span> General
          </button>
          <button
            className={`tb ${activeTab === "account" ? "act" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            <span>◈</span> Account
          </button>
        </nav>

        {user && <div className="sb-email">{user.email}</div>}
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="mc">

        {/* Toast */}
        {toast && (
          <div className={`toast ${toast.type}`}>{toast.text}</div>
        )}

        {/* ── GENERAL TAB ──────────────────────────────────────────────── */}
        {activeTab === "general" && (
          <div>
            <header className="ph">
              <h1>General</h1>
              <p>Manage your profile and preferences</p>
            </header>

            {/* Profile section */}
            <section className="sec">
              <h2 className="st">Profile</h2>

              {/* Avatar row */}
              <div className="av-row">
                <div
                  className="av-wrap"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Change profile photo"
                >
                  {avatar
                    ? <img src={avatar} alt="Profile photo" className="av-img" />
                    : (
                      <span className="av-ph">
                        {fullName?.[0]?.toUpperCase()
                          || user?.email?.[0]?.toUpperCase()
                          || "?"}
                      </span>
                    )
                  }
                  <div className="av-ov"><span>Edit</span></div>
                </div>

                <div className="av-meta">
                  <button className="btn-o" onClick={() => fileRef.current?.click()}>
                    Upload photo
                  </button>
                  {avatar && (
                    <button className="btn-g" onClick={handleRemoveAvatar}>
                      Remove
                    </button>
                  )}
                  <p className="hint">PNG or JPG · max 2 MB</p>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Name / nickname / role fields */}
              <div className="fg">
                <div className="f">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Maria Santos"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="f">
                  <label htmlFor="nickname">What should Nexion call you?</label>
                  <input
                    id="nickname"
                    type="text"
                    placeholder="e.g. Mari"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <div className="f fw">
                  <label htmlFor="researcherType">What kind of researcher are you?</label>
                  <div className="sw">
                    <select
                      id="researcherType"
                      value={researcherType}
                      onChange={(e) => setResearcherType(e.target.value)}
                    >
                      <option value="" disabled>Select your role…</option>
                      {RESEARCHER_TYPES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <span className="sa">▾</span>
                  </div>
                </div>
              </div>
            </section>

            <div className="div" />

            {/* Preferences section */}
            <section className="sec">
              <h2 className="st">Preferences</h2>

              <div className="f">
                <label>Appearance</label>
                <div className="tg" role="group" aria-label="Appearance options">
                  {APPEARANCE_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      className={`tb2 ${appearance === o.value ? "sel" : ""}`}
                      onClick={() => setAppearance(o.value)}
                      aria-pressed={appearance === o.value}
                    >
                      <span>{o.icon}</span>{o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="f" style={{ marginTop: 20 }}>
                <label htmlFor="chatFont">Chat Font</label>
                <div className="sw" style={{ maxWidth: 280 }}>
                  <select
                    id="chatFont"
                    value={chatFont}
                    onChange={(e) => setChatFont(e.target.value)}
                    style={{ fontFamily: chatFont }}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <span className="sa">▾</span>
                </div>
                <p className="hint" style={{ fontFamily: chatFont, marginTop: 8 }}>
                  Preview: The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </section>

            <div style={{ marginTop: 36 }}>
              <button
                className="btn-p"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ──────────────────────────────────────────────── */}
        {activeTab === "account" && (
          <div>
            <header className="ph">
              <h1>Account</h1>
              <p>Manage your account and active sessions</p>
            </header>

            {/* Account actions */}
            <section className="sec">
              <h2 className="st">Account Actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                <div className="ac">
                  <div>
                    <h3>Log out</h3>
                    <p>Sign out of your current session on this device.</p>
                  </div>
                  <button
                    className="btn-o"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>

                <div className="ac danger">
                  <div>
                    <h3>Delete account</h3>
                    <p>
                      Permanently removes your account, all chats, projects, and
                      messages. Cannot be undone.
                    </p>
                  </div>
                  <button
                    className="btn-d"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete account
                  </button>
                </div>

              </div>
            </section>

            <div className="div" />

            {/* Sessions */}
            <section className="sec">
              <h2 className="st">Active Sessions</h2>
              <p className="hint" style={{ marginBottom: 16 }}>
                Showing your current session. To manage all devices, use the
                Supabase dashboard.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Created</th>
                      <th>Last active</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          style={{ color: "#4a4845", textAlign: "center", padding: "24px 0" }}
                        >
                          No session data available
                        </td>
                      </tr>
                    ) : (
                      sessions.map((s, i) => (
                        <tr key={s.id || i} className={s.current ? "cs" : ""}>
                          <td>
                            <span className="dn">{parseDevice(s.user_agent)}</span>
                            {s.current && <span className="bc">Current</span>}
                          </td>
                          <td>{fmt(s.created_at)}</td>
                          <td>{fmt(s.updated_at)}</td>
                          <td>
                            {!s.current && (
                              <button
                                className="btn-r"
                                onClick={() => handleRevokeSession(s.id)}
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ── Delete confirmation modal ─────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="mb"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="mo" onClick={(e) => e.stopPropagation()}>
            <h2 id="delete-modal-title">Delete account?</h2>
            <p>
              This will permanently delete your account and{" "}
              <strong>all chats, projects, and messages</strong>. This action{" "}
              <strong>cannot be undone</strong>.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                className="btn-o"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-d"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Layout */
        .sr  { display: flex; min-height: 100vh; background: #0d0e11; color: #e8e6e1; font-family: 'Georgia', 'Times New Roman', serif; }

        /* Sidebar */
        .sb  { width: 220px; flex-shrink: 0; background: #111318; border-right: 1px solid #1e2029; display: flex; flex-direction: column; padding: 28px 16px; gap: 32px; position: sticky; top: 0; height: 100vh; }
        .sb-logo { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
        .lm  { width: 30px; height: 30px; background: linear-gradient(135deg, #c9a96e, #e8d5a3); border-radius: 7px; display: grid; place-items: center; font-family: 'Georgia', serif; font-weight: 700; font-size: 16px; color: #0d0e11; }
        .lt  { font-size: 17px; font-weight: 600; letter-spacing: .04em; color: #e8e6e1; }
        .sb-email { margin-top: auto; padding: 10px 12px; font-size: 11px; color: #3a3835; font-family: system-ui, sans-serif; word-break: break-all; }

        /* Sidebar nav */
        .tn  { display: flex; flex-direction: column; gap: 4px; }
        .tb  { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; border: none; background: transparent; color: #7a7875; font-family: inherit; font-size: 14px; cursor: pointer; text-align: left; transition: all .15s; letter-spacing: .02em; }
        .tb:hover { background: #1a1c23; color: #c9a96e; }
        .tb.act   { background: #1a1c23; color: #c9a96e; font-weight: 600; }

        /* Main content */
        .mc  { flex: 1; overflow-y: auto; padding: 48px 56px; max-width: 760px; position: relative; }
        .ph  { margin-bottom: 36px; }
        .ph h1 { font-size: 26px; font-weight: 700; color: #f0ece4; letter-spacing: -.01em; margin-bottom: 6px; }
        .ph p  { font-size: 14px; color: #5a5855; font-family: system-ui, sans-serif; }

        /* Sections */
        .sec { margin-bottom: 32px; }
        .st  { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: #c9a96e; margin-bottom: 20px; font-family: system-ui, sans-serif; font-weight: 600; }
        .div { border: none; border-top: 1px solid #1e2029; margin: 32px 0; }

        /* Avatar */
        .av-row  { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
        .av-wrap { width: 72px; height: 72px; border-radius: 50%; background: #1e2029; border: 2px solid #2a2c35; overflow: hidden; cursor: pointer; position: relative; flex-shrink: 0; transition: border-color .2s; }
        .av-wrap:hover, .av-wrap:focus { border-color: #c9a96e; outline: none; }
        .av-wrap:hover .av-ov { opacity: 1; }
        .av-img  { width: 100%; height: 100%; object-fit: cover; display: block; }
        .av-ph   { width: 100%; height: 100%; display: grid; place-items: center; font-size: 26px; color: #4a4845; font-weight: 700; }
        .av-ov   { position: absolute; inset: 0; background: rgba(0,0,0,.55); display: grid; place-items: center; opacity: 0; transition: opacity .2s; font-size: 11px; color: #e8d5a3; font-family: system-ui, sans-serif; letter-spacing: .05em; }
        .av-meta { display: flex; flex-direction: column; gap: 8px; }

        /* Form */
        .hint { font-size: 12px; color: #4a4845; font-family: system-ui, sans-serif; }
        .fg   { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .fw   { grid-column: 1 / -1; }
        .f    { display: flex; flex-direction: column; gap: 8px; }
        .f label { font-size: 13px; color: #9a9690; font-family: system-ui, sans-serif; }
        .f input, .f select { background: #14161c; border: 1px solid #1e2029; border-radius: 8px; padding: 10px 14px; color: #e8e6e1; font-family: inherit; font-size: 14px; outline: none; transition: border-color .15s; width: 100%; appearance: none; }
        .f input::placeholder { color: #3a3835; }
        .f input:focus, .f select:focus { border-color: #c9a96e; }
        .sw  { position: relative; }
        .sw select { padding-right: 32px; cursor: pointer; }
        .sa  { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #5a5855; font-size: 12px; pointer-events: none; }

        /* Appearance toggle */
        .tg  { display: flex; gap: 8px; background: #14161c; border: 1px solid #1e2029; border-radius: 10px; padding: 5px; width: fit-content; }
        .tb2 { display: flex; align-items: center; gap: 7px; padding: 8px 18px; border-radius: 7px; border: none; background: transparent; color: #5a5855; font-family: system-ui, sans-serif; font-size: 13px; cursor: pointer; transition: all .18s; }
        .tb2:hover   { color: #c9a96e; }
        .tb2.sel     { background: #1e2029; color: #e8d5a3; box-shadow: 0 1px 4px rgba(0,0,0,.4); }

        /* Buttons */
        .btn-p { padding: 10px 24px; background: linear-gradient(135deg, #c9a96e, #e8d5a3); border: none; border-radius: 8px; color: #0d0e11; font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity .15s; letter-spacing: .02em; }
        .btn-p:hover:not(:disabled) { opacity: .88; }
        .btn-p:disabled { opacity: .45; cursor: not-allowed; }

        .btn-o { padding: 9px 18px; background: transparent; border: 1px solid #2a2c35; border-radius: 8px; color: #9a9690; font-family: system-ui, sans-serif; font-size: 13px; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .btn-o:hover:not(:disabled) { border-color: #c9a96e; color: #c9a96e; }
        .btn-o:disabled { opacity: .4; cursor: not-allowed; }

        .btn-g { padding: 9px 14px; background: transparent; border: none; color: #5a5855; font-family: system-ui, sans-serif; font-size: 13px; cursor: pointer; transition: color .15s; }
        .btn-g:hover { color: #e8e6e1; }

        .btn-d { padding: 9px 18px; background: transparent; border: 1px solid #4a1e1e; border-radius: 8px; color: #c45c5c; font-family: system-ui, sans-serif; font-size: 13px; cursor: pointer; transition: all .15s; white-space: nowrap; }
        .btn-d:hover:not(:disabled) { background: #3a1515; border-color: #c45c5c; }
        .btn-d:disabled { opacity: .4; cursor: not-allowed; }

        /* Account action cards */
        .ac { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 20px; background: #14161c; border: 1px solid #1e2029; border-radius: 10px; }
        .ac h3 { font-size: 14px; color: #e8e6e1; margin-bottom: 4px; font-family: system-ui, sans-serif; }
        .ac p  { font-size: 13px; color: #5a5855; font-family: system-ui, sans-serif; line-height: 1.5; max-width: 360px; }
        .ac.danger { border-color: #2a1515; }

        /* Sessions table */
        .tbl    { width: 100%; border-collapse: collapse; font-family: system-ui, sans-serif; font-size: 13px; }
        .tbl th { text-align: left; padding: 10px 14px; color: #4a4845; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; border-bottom: 1px solid #1e2029; font-weight: 600; }
        .tbl td { padding: 14px; color: #9a9690; border-bottom: 1px solid #16181f; vertical-align: middle; }
        .tbl tr:last-child td { border-bottom: none; }
        .tbl tr:hover td { background: #14161c; }
        .cs td  { color: #c9c5be; }
        .dn     { color: #d8d4ce; }
        .bc     { display: inline-block; margin-left: 8px; padding: 2px 7px; background: #1a2a1a; border: 1px solid #2a4a2a; border-radius: 4px; font-size: 10px; color: #6aaa6a; letter-spacing: .05em; vertical-align: middle; }
        .btn-r  { padding: 5px 12px; background: transparent; border: 1px solid #2a2c35; border-radius: 6px; color: #5a5855; font-family: inherit; font-size: 12px; cursor: pointer; transition: all .15s; }
        .btn-r:hover { border-color: #c45c5c; color: #c45c5c; }

        /* Delete modal */
        .mb  { position: fixed; inset: 0; background: rgba(0,0,0,.72); display: grid; place-items: center; z-index: 100; backdrop-filter: blur(4px); }
        .mo  { background: #14161c; border: 1px solid #2a1515; border-radius: 14px; padding: 32px; max-width: 420px; width: 90%; }
        .mo h2 { font-size: 20px; color: #f0ece4; margin-bottom: 12px; }
        .mo p  { font-size: 14px; color: #6a6865; font-family: system-ui, sans-serif; line-height: 1.6; margin-bottom: 24px; }
        .mo strong { color: #c9c5be; }

        /* Toast */
        .toast { position: fixed; top: 24px; right: 24px; z-index: 200; padding: 12px 20px; border-radius: 8px; font-family: system-ui, sans-serif; font-size: 13px; animation: fsi .2s ease; pointer-events: none; }
        .toast.success { background: #1a2a1a; border: 1px solid #2a4a2a; color: #6aaa6a; }
        .toast.error   { background: #2a1515; border: 1px solid #4a2a2a; color: #c45c5c; }
        @keyframes fsi { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

        /* Scrollbar */
        .mc::-webkit-scrollbar       { width: 5px; }
        .mc::-webkit-scrollbar-track { background: transparent; }
        .mc::-webkit-scrollbar-thumb { background: #2a2c35; border-radius: 10px; }

        /* Spin animation for loading */
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}