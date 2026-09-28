import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, FileText, Check } from "lucide-react";
import { SystemState } from "../types";

interface GitSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState | null;
  onRefresh: () => void;
}

export const GitSettingsModal: React.FC<GitSettingsModalProps> = ({
  isOpen,
  onClose,
  systemState,
  onRefresh,
}) => {
  const [gitName, setGitName] = useState("");
  const [gitEmail, setGitEmail] = useState("");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (systemState) {
      setGitName(systemState.git_name || "");
      setGitEmail(systemState.git_email || "");
    }
  }, [systemState, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("update_git_config", { name: gitName, email: gitEmail });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2200);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRaw = async () => {
    try {
      await invoke("open_gitconfig");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--cc-text-primary)" }}>
            Réglages Git Globaux
          </h3>
          <button className="cc-bottom-link" style={{ width: "auto", padding: "4px" }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ fontSize: "11px", color: "var(--cc-text-muted)", lineHeight: 1.4 }}>
          Ces valeurs sont appliquées directement dans votre fichier <code>~/.gitconfig</code>.
        </div>

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="form-group">
            <label className="form-label">Nom Git (user.name)</label>
            <input
              type="text"
              className="form-input"
              value={gitName}
              onChange={(e) => setGitName(e.target.value)}
              placeholder="ex: Votre Nom"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Git (user.email)</label>
            <input
              type="email"
              className="form-input"
              value={gitEmail}
              onChange={(e) => setGitEmail(e.target.value)}
              placeholder="ex: vous@example.com"
              required
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
            <button
              type="button"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--cc-text-muted)",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
              onClick={handleOpenRaw}
              title="Ouvrir le fichier brut ~/.gitconfig"
            >
              <FileText size={12} />
              Ouvrir ~/.gitconfig brut
            </button>

            <button
              type="submit"
              className="cc-badge"
              style={{
                cursor: "pointer",
                padding: "6px 14px",
                background: "var(--cc-purple)",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {savedMsg ? <Check size={12} strokeWidth={3} /> : null}
              {savedMsg ? "Enregistré !" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
