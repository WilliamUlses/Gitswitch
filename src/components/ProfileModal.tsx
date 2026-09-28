import React, { useState, useEffect } from "react";
import { X, Check, Key } from "lucide-react";
import { GitProfile } from "../types";

interface ProfileModalProps {
  profile: GitProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: GitProfile) => void;
}

const COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#8b5cf6", // Purple
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

const ICONS = [
  { id: "briefcase", label: "Pro" },
  { id: "user", label: "Perso" },
  { id: "terminal", label: "Terminal" },
  { id: "laptop", label: "Laptop" },
  { id: "sparkles", label: "Sparkles" },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<GitProfile>>({
    name: "",
    git_name: "",
    git_email: "",
    ssh_key_path: "",
    gh_user: "",
    color: "#3b82f6",
    icon: "briefcase",
  });

  useEffect(() => {
    if (profile) {
      setFormData({ ...profile });
    } else {
      setFormData({
        name: "",
        git_name: "",
        git_email: "",
        ssh_key_path: "~/.ssh/id_ed25519",
        gh_user: "",
        color: "#3b82f6",
        icon: "briefcase",
      });
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.git_name || !formData.git_email) {
      alert("Veuillez remplir au minimum le nom, le git user.name et l'email.");
      return;
    }

    const newProfile: GitProfile = {
      id: profile ? profile.id : `profile_${Date.now()}`,
      name: formData.name || "Nouveau Profil",
      git_name: formData.git_name || "",
      git_email: formData.git_email || "",
      ssh_key_path: formData.ssh_key_path ? formData.ssh_key_path.trim() : null,
      gh_user: formData.gh_user ? formData.gh_user.trim() : null,
      signing_key: formData.signing_key || null,
      color: formData.color || "#3b82f6",
      icon: formData.icon || "briefcase",
    };

    onSave(newProfile);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 className="modal-title">
            {profile ? "Modifier le Profil" : "Nouveau Profil Git"}
          </h3>
          <button className="modal-close-btn" onClick={onClose} title="Fermer">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="form-group">
            <label className="form-label">Titre du Profil (ex: Pro / Client)</label>
            <input
              type="text"
              className="form-input"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ex: Pro (Entreprise)"
              required
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Git user.name</label>
              <input
                type="text"
                className="form-input"
                value={formData.git_name || ""}
                onChange={(e) => setFormData({ ...formData, git_name: e.target.value })}
                placeholder="ex: dev-user"
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Git user.email</label>
              <input
                type="email"
                className="form-input"
                value={formData.git_email || ""}
                onChange={(e) => setFormData({ ...formData, git_email: e.target.value })}
                placeholder="ex: dev@company.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Compte GitHub CLI (optionnel)</label>
            <input
              type="text"
              className="form-input"
              value={formData.gh_user || ""}
              onChange={(e) => setFormData({ ...formData, gh_user: e.target.value })}
              placeholder="ex: github-username"
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Chemin de la clé SSH (optionnel)</label>
              <div style={{ display: "flex", gap: "4px" }}>
                <span
                  style={{ fontSize: "9px", color: "#38bdf8", cursor: "pointer" }}
                  onClick={() => setFormData({ ...formData, ssh_key_path: "~/.ssh/id_ed25519" })}
                >
                  ed25519
                </span>
                <span
                  style={{ fontSize: "9px", color: "#38bdf8", cursor: "pointer" }}
                  onClick={() => setFormData({ ...formData, ssh_key_path: "~/.ssh/id_rsa" })}
                >
                  rsa
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
              <input
                type="text"
                className="form-input"
                style={{ width: "100%", paddingLeft: "26px", fontFamily: "var(--font-mono)", fontSize: "11px" }}
                value={formData.ssh_key_path || ""}
                onChange={(e) => setFormData({ ...formData, ssh_key_path: e.target.value })}
                placeholder="~/.ssh/id_ed25519_work"
              />
              <Key size={13} style={{ position: "absolute", left: "8px", color: "var(--text-dim)" }} />
            </div>
          </div>

          {/* Color Picker */}
          <div className="form-group">
            <label className="form-label">Couleur du thème</label>
            <div className="color-picker-row">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${formData.color === c ? "selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setFormData({ ...formData, color: c })}
                />
              ))}
            </div>
          </div>

          {/* Icon Selector */}
          <div className="form-group">
            <label className="form-label">Icône</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {ICONS.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  style={{
                    flex: 1,
                    padding: "6px 4px",
                    background: formData.icon === item.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                    border: formData.icon === item.id ? "1px solid var(--border-medium)" : "1px solid transparent",
                    borderRadius: "var(--radius-sm)",
                    color: formData.icon === item.id ? "white" : "var(--text-muted)",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                  onClick={() => setFormData({ ...formData, icon: item.id })}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
            <button
              type="button"
              className="footer-btn"
              onClick={onClose}
            >
              Annuler
            </button>
            <button type="submit" className="btn-primary">
              <Check size={13} />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
