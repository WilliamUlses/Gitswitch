import React, { useState } from "react";
import {
  Briefcase,
  User,
  Key,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  Terminal,
  Laptop,
  Sparkles,
} from "lucide-react";
import { GitProfile } from "../types";

interface ProfileCardProps {
  profile: GitProfile;
  isActive: boolean;
  onSelect: (profile: GitProfile) => void;
  onEdit: (profile: GitProfile) => void;
  onDelete: (id: string) => void;
  isSwitching: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isActive,
  onSelect,
  onEdit,
  onDelete,
  isSwitching,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);

  const getProfileIcon = () => {
    switch (profile.icon) {
      case "briefcase":
        return <Briefcase size={10} />;
      case "terminal":
        return <Terminal size={10} />;
      case "laptop":
        return <Laptop size={10} />;
      case "sparkles":
        return <Sparkles size={10} />;
      default:
        return <User size={10} />;
    }
  };

  const avatarUrl = profile.gh_user
    ? `https://github.com/${profile.gh_user}.png`
    : `https://github.com/${profile.git_name}.png`;

  const initials = (profile.git_name || profile.name || "G")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`profile-card ${isActive ? "active" : ""}`}
      style={
        {
          "--profile-color": profile.color || "#3b82f6",
          "--profile-glow": `${profile.color || "#3b82f6"}40`,
        } as React.CSSProperties
      }
      onClick={() => {
        if (!isActive && !isSwitching) {
          onSelect(profile);
        }
      }}
    >
      <div className="profile-left">
        <div className="avatar-wrapper">
          {!imgError ? (
            <img
              src={avatarUrl}
              alt={profile.git_name}
              className="avatar-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="avatar-fallback">{initials}</div>
          )}
          <div className="avatar-badge-icon">{getProfileIcon()}</div>
        </div>

        <div className="profile-info">
          <div className="profile-title-row">
            <span className="profile-name">{profile.name}</span>
          </div>
          <span className="profile-email">{profile.git_email}</span>

          <div className="profile-tags">
            <span className="tag-badge active-tool">Git: {profile.git_name}</span>
            {profile.ssh_key_path && (
              <span className="tag-badge" title={profile.ssh_key_path}>
                <Key size={8} style={{ marginRight: 2, display: "inline" }} />
                SSH
              </span>
            )}
            {profile.gh_user && (
              <span className="tag-badge" title={`Compte GitHub CLI: ${profile.gh_user}`}>
                gh: {profile.gh_user}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="profile-right" onClick={(e) => e.stopPropagation()}>
        <button
          className={`switch-btn ${isActive ? "active-state" : "inactive-state"}`}
          onClick={() => {
            if (!isActive && !isSwitching) {
              onSelect(profile);
            }
          }}
          disabled={isSwitching}
        >
          {isActive ? (
            <>
              <Check size={12} strokeWidth={3} />
              Actif
            </>
          ) : (
            "Activer"
          )}
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="card-dropdown-btn"
            title="Options du profil"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                background: "#1e2230",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                padding: "4px",
                zIndex: 20,
                boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                minWidth: "110px",
              }}
            >
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 8px",
                  fontSize: "11px",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  textAlign: "left",
                }}
                onClick={() => {
                  setShowMenu(false);
                  onEdit(profile);
                }}
              >
                <Edit2 size={12} />
                Modifier
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 8px",
                  fontSize: "11px",
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-rose)",
                  cursor: "pointer",
                  borderRadius: "4px",
                  textAlign: "left",
                }}
                onClick={() => {
                  setShowMenu(false);
                  onDelete(profile.id);
                }}
              >
                <Trash2 size={12} />
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
