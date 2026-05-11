"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Icons ────────────────────────────────────────────────────
const IconNewChat = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconProject = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IconSidebarToggle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>
  </svg>
);
const IconBookmark = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24"
    fill={filled ? "#60a5fa" : "none"}
    stroke={filled ? "#60a5fa" : "currentColor"}
    strokeWidth="1.8" strokeLinecap="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconHome = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
    <polyline points="9 21 9 12 15 12 15 21"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconDots = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
  </svg>
);
const IconRename = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconDeleteTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────
function Avatar({ user, size = 32 }) {
  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.38), fontWeight: "700", color: "#fff",
      fontFamily: "monospace", flexShrink: 0, letterSpacing: "0.02em",
      border: "1.5px solid rgba(59,130,246,0.4)",
    }}>
      {initials}
    </div>
  );
}

// ─── Collapsed icon rail button ───────────────────────────────
function RailBtn({ icon, title, onClick, href }) {
  const style = {
    width: "40px", height: "40px", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "none", border: "1px solid transparent",
    cursor: "pointer", color: "#475569",
    transition: "all 0.15s", flexShrink: 0,
    textDecoration: "none",
  };
  const hoverIn = e => {
    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
    e.currentTarget.style.color = "#94a3b8";
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
  };
  const hoverOut = e => {
    e.currentTarget.style.background = "none";
    e.currentTarget.style.color = "#475569";
    e.currentTarget.style.borderColor = "transparent";
  };
  if (href) {
    return (
      <Link href={href} title={title} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
        {icon}
      </Link>
    );
  }
  return (
    <button onClick={onClick} title={title} style={style} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
      {icon}
    </button>
  );
}

// ─── Chat item ────────────────────────────────────────────────
function ChatItem({ item, onSend, onToggleFavorite, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState(item.label);

  function handleRename() {
    if (newName.trim() && newName !== item.label) {
      onRename(item.id, newName.trim());
    }
    setRenaming(false);
    setNewName(item.label);
    setMenuOpen(false);
  }

  if (renaming) {
    return (
      <div style={{ padding: "4px 10px", display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") { setRenaming(false); setNewName(item.label); }
          }}
          autoFocus
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(59,130,246,0.4)",
            borderRadius: "4px", padding: "4px 8px", color: "#e2e8f0", fontSize: "12px",
            fontFamily: "Georgia, serif", outline: "none",
          }}
        />
        <button onClick={handleRename} style={{
          background: "none", border: "none", cursor: "pointer", color: "#60a5fa",
          fontSize: "11px", padding: "2px 4px", fontFamily: "monospace",
        }}>Save</button>
        <button onClick={() => { setRenaming(false); setNewName(item.label); }} style={{
          background: "none", border: "none", cursor: "pointer", color: "#475569",
          fontSize: "11px", padding: "2px 4px", fontFamily: "monospace",
        }}>Cancel</button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        borderRadius: "6px", transition: "background 0.15s",
        padding: "2px 4px 2px 10px",
        position: "relative",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; setMenuOpen(false); }}
    >
      {/* 3-dot menu button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        title="More options"
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "4px", flexShrink: 0,
          color: "#475569",
          display: "flex", alignItems: "center",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#94a3b8"}
        onMouseLeave={e => e.currentTarget.style.color = "#475569"}
      >
        <IconDots />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div style={{
          position: "absolute", left: "0", top: "100%", background: "#0d1424",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
          overflow: "hidden", minWidth: "120px", zIndex: 1000,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)", marginTop: "4px",
        }}>
          <button
            onClick={() => { setRenaming(true); setMenuOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              width: "100%", padding: "8px 12px", background: "none", border: "none",
              cursor: "pointer", color: "#94a3b8", fontSize: "12px",
              fontFamily: "Georgia, serif", textAlign: "left", transition: "background 0.12s",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e2e8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <IconRename /> Rename
          </button>
          <button
            onClick={() => { onDelete(item.id); setMenuOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              width: "100%", padding: "8px 12px", background: "none", border: "none",
              cursor: "pointer", color: "#f87171", fontSize: "12px",
              fontFamily: "Georgia, serif", textAlign: "left", transition: "background 0.12s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
          >
            <IconDeleteTrash /> Delete
          </button>
        </div>
      )}

      <button
        onClick={() => onSend(item.label)}
        style={{
          flex: 1, background: "none", border: "none", cursor: "pointer",
          color: "#64748b", fontSize: "12px", fontFamily: "Georgia, serif",
          textAlign: "left", overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", padding: "4px 0",
        }}
      >{item.label}</button>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
        title={item.favorited ? "Remove from favorites" : "Add to favorites"}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "4px", flexShrink: 0,
          color: item.favorited ? "#60a5fa" : "#334155",
          display: "flex", alignItems: "center",
          transition: "color 0.15s",
          opacity: item.favorited ? 1 : 0,
        }}
        className="chat-item-bookmark"
        onMouseEnter={e => { e.currentTarget.style.opacity = "1"; if (!item.favorited) e.currentTarget.style.color = "#64748b"; }}
        onMouseLeave={e => { if (!item.favorited) { e.currentTarget.style.color = "#334155"; e.currentTarget.style.opacity = "0"; } }}
      >
        <IconBookmark filled={item.favorited} />
      </button>
    </div>
  );
}

// ─── Avatar Dropdown ──────────────────────────────────────────
function AvatarDropdown({ user, collapsed = false, onLogout }) {
  const [open, setOpen] = useState(false);

  const menuStyle = collapsed ? {
    position: "absolute",
    bottom: "48px",
    left: "56px",
  } : {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "0",
    right: "0",
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        title={`${user.name} · ${user.plan || "Free plan"}`}
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: "pointer",
          display: "flex", alignItems: "center",
          ...(collapsed ? { marginBottom: "8px" } : { gap: "10px", padding: "8px 10px", borderRadius: "10px", transition: "background 0.15s" }),
        }}
        onMouseEnter={e => { if (!collapsed) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        onMouseLeave={e => { if (!collapsed) e.currentTarget.style.background = "none"; }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Avatar user={user} size={34} />
          <span style={{
            position: "absolute", bottom: "1px", right: "1px",
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#22c55e", border: "1.5px solid #0a0f1a",
          }} />
        </div>

        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: "13px", color: "#cbd5e1", fontFamily: "Georgia, serif",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "500",
              }}>{user.name}</div>
              <div style={{
                fontSize: "10px", color: "#475569", fontFamily: "monospace",
                letterSpacing: "0.06em", marginTop: "1px",
              }}>{(user.plan || "Free plan").toUpperCase()}</div>
            </div>
            {/* Chevron */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
              <path d="m18 15-6-6-6 6"/>
            </svg>
          </>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <>
          {/* Click-away backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            ...menuStyle,
            zIndex: 1000,
            background: "#0d1424",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: "160px",
            animation: "slideDownSmooth 0.15s ease-out",
          }}>
            {/* User info header */}
            {collapsed && (
              <div style={{
                padding: "10px 14px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: "12px", color: "#cbd5e1", fontFamily: "Georgia, serif", fontWeight: "500" }}>
                  {user.name}
                </div>
                <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace", letterSpacing: "0.06em", marginTop: "2px" }}>
                  {(user.plan || "Free plan").toUpperCase()}
                </div>
              </div>
            )}

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", color: "#94a3b8", fontSize: "13px",
                fontFamily: "Georgia, serif", textDecoration: "none",
                transition: "background 0.12s, color 0.12s",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#94a3b8"; }}
            >
              <IconSettings /> Settings
            </Link>

            {/* Logout */}
            <button
              onClick={() => { setOpen(false); onLogout?.(); }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                color: "#f87171", fontSize: "13px", fontFamily: "Georgia, serif",
                textAlign: "left", transition: "background 0.12s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────
/**
 * Props:
 *   open             boolean   — whether sidebar is expanded
 *   onOpen           fn        — called to expand sidebar
 *   onClose          fn        — called to collapse sidebar
 *   recents          array     — [{ id, label, favorited }]
 *   onToggleFavorite fn(id)
 *   onSend           fn(label) — load a past chat
 *   onNewChat        fn        — saves current chat then clears (handled in page.jsx)
 *   onRenameChat     fn(id, newName) — rename a chat
 *   onDeleteChat     fn(id) — delete a chat
 *   user             object    — { name, plan } | null
 *   onLoginClick     fn        — called when login button is clicked
 */
export default function Sidebar({ open, onOpen, onClose, recents, onToggleFavorite, onSend, onNewChat, user, onRenameChat, onDeleteChat, onLoginClick, onLogout }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [favOpen, setFavOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const favorites = recents.filter(r => r.favorited);
  const recentOnly = recents.filter(r => !r.favorited);

  const filteredRecents = recentOnly.filter(r =>
    r.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFavorites = favorites.filter(r =>
    r.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Collapsed: icon-only rail ────────────────────────────────
  if (!open) {
    return (
      <div style={{
        width: "60px", minWidth: "60px",
        height: "100vh",
        background: "#0a0f1a",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        alignItems: "center",
        padding: "12px 0",
        flexShrink: 0,
        gap: "2px",
      }}>
        {/* Toggle button */}
        <RailBtn icon={<IconSidebarToggle />} title="Open sidebar" onClick={onOpen} />

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", width: "32px", margin: "6px 0" }} />

        <RailBtn icon={<IconHome />}    title="Home"     href="/" />
        <RailBtn icon={<IconNewChat />} title="New chat" onClick={onNewChat} />

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", width: "32px", margin: "6px 0" }} />

        <RailBtn icon={<IconProject />}  title="Projects"  href="/projects" />
        <RailBtn icon={<IconSettings />} title="Settings"  href="/settings" />

        {/* Push avatar to bottom */}
        <div style={{ flex: 1 }} />

        {user && <AvatarDropdown user={user} collapsed onLogout={onLogout} />}

        <style>{`
          @keyframes slideInLeft { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        `}</style>
      </div>
    );
  }

  // ── Expanded sidebar ─────────────────────────────────────────
  return (
    <div style={{
      width: "260px", minWidth: "260px",
      height: "100vh",
      background: "#0a0f1a",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
      animation: "slideInLeft 0.3s ease-out",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 1rem 0.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "26px", height: "26px", borderRadius: "6px",
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "700", color: "#fff", fontFamily: "monospace",
          }}>N</div>
          <span style={{ fontSize: "15px", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>Nexion</span>
        </div>
        <button
          onClick={onClose}
          title="Collapse sidebar"
          style={{
            background: "none", border: "1px solid transparent", cursor: "pointer",
            color: "#334155", padding: "6px", borderRadius: "6px",
            display: "flex", alignItems: "center", transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#94a3b8";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "#334155";
            e.currentTarget.style.background = "none";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          <IconSidebarToggle />
        </button>
      </div>

      {/* Scrollable nav */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 0.5rem" }}>

        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 10px", borderRadius: "8px",
          color: "#94a3b8", fontSize: "13px", fontFamily: "Georgia, serif",
          textDecoration: "none", transition: "background 0.15s, color 0.15s",
          marginBottom: "2px", whiteSpace: "nowrap",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#e2e8f0"; }}
          onMouseLeave={e => { e.currentTarget.style.background = ""; e.currentTarget.style.color = "#94a3b8"; }}
        >
          <IconHome />Home
        </Link>

        <button onClick={() => { onNewChat(); onClose(); }} style={{
          display: "flex", alignItems: "center", gap: "10px",
          width: "100%", padding: "8px 10px", borderRadius: "8px",
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", fontSize: "13px", fontFamily: "Georgia, serif",
          transition: "background 0.15s", marginBottom: "2px", whiteSpace: "nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <IconNewChat /><span>New chat</span>
        </button>

        <button onClick={() => setSearchOpen(!searchOpen)} style={{
          display: "flex", alignItems: "center", gap: "10px",
          width: "100%", padding: "8px 10px", borderRadius: "8px",
          background: "none", border: "none", cursor: "pointer",
          color: "#94a3b8", fontSize: "13px", fontFamily: "Georgia, serif",
          transition: "background 0.15s", marginBottom: "2px", whiteSpace: "nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <IconSearch /><span>Search</span>
        </button>

        {searchOpen && (
          <div style={{ padding: "4px 10px 8px" }}>
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
                padding: "6px 10px", color: "#e2e8f0", fontSize: "12px",
                fontFamily: "Georgia, serif", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        )}

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "6px 10px" }} />

        <Link href="/projects" style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "8px 10px", borderRadius: "8px",
          color: "#94a3b8", fontSize: "13px", textDecoration: "none",
          transition: "background 0.15s", marginBottom: "2px", whiteSpace: "nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          <IconProject /><span>Projects</span>
        </Link>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "6px 10px" }} />

        {/* ── Favorites ── */}
        <button onClick={() => setFavOpen(!favOpen)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "6px 10px", borderRadius: "6px",
          background: "none", border: "none", cursor: "pointer",
          color: "#475569", fontSize: "11px", fontFamily: "monospace",
          letterSpacing: "0.08em", marginBottom: "2px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#60a5fa" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            <span>FAVORITES</span>
          </div>
          <IconChevron open={favOpen} />
        </button>

        {favOpen && (
          <div style={{ marginBottom: "4px" }}>
            {filteredFavorites.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#1e293b", padding: "6px 10px", fontFamily: "monospace" }}>
                {searchQuery ? "No results" : "No favorites yet"}
              </p>
            ) : (
              filteredFavorites.map(item => (
                <ChatItem key={item.id} item={item} onSend={(label) => { onSend(label); onClose(); }} onToggleFavorite={onToggleFavorite} onRename={onRenameChat} onDelete={onDeleteChat} />
              ))
            )}
          </div>
        )}

        {/* ── Recents ── */}
        <button onClick={() => setRecentsOpen(!recentsOpen)} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", padding: "6px 10px", borderRadius: "6px",
          background: "none", border: "none", cursor: "pointer",
          color: "#475569", fontSize: "11px", fontFamily: "monospace",
          letterSpacing: "0.08em", marginBottom: "2px",
        }}>
          <span>RECENTS</span>
          <IconChevron open={recentsOpen} />
        </button>

        {recentsOpen && (
          <div>
            {filteredRecents.length === 0 ? (
              <p style={{ fontSize: "11px", color: "#1e293b", padding: "6px 10px", fontFamily: "monospace" }}>
                {searchQuery ? "No results" : "No recent chats yet"}
              </p>
            ) : (
              filteredRecents.map(item => (
                <ChatItem key={item.id} item={item} onSend={(label) => { onSend(label); onClose(); }} onToggleFavorite={onToggleFavorite} onRename={onRenameChat} onDelete={onDeleteChat} />
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Profile section (expanded) ── */}
      {user ? (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 12px",
          flexShrink: 0,
          position: "relative",
        }}>
          <AvatarDropdown user={user} onLogout={onLogout} />
        </div>
      ) : (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "12px",
          flexShrink: 0,
        }}>
          <button
            onClick={onLoginClick}
            style={{
              width: "100%",
              background: "#1d4ed8",
              border: "none",
              color: "#fff",
              padding: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "Georgia, serif",
              fontWeight: "500",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#1e40af"}
            onMouseLeave={e => e.currentTarget.style.background = "#1d4ed8"}
          >
            Log In
          </button>
        </div>
      )}

      <style suppressHydrationWarning>{`
        .chat-item-bookmark { opacity: 0; }
        div:hover > .chat-item-bookmark { opacity: 1 !important; }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideOutLeft { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-20px)} }
        @keyframes slideDownSmooth { from{opacity:0;max-height:0;transform:translateY(-8px)} to{opacity:1;max-height:200px;transform:translateY(0)} }
      `}</style>
    </div>
  );
}