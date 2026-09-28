import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Plus, Edit2, Trash2, Code } from "lucide-react";
import { GitProfile } from "../types";

interface ProfilesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: GitProfile[];
  onAddNew: () => void;
  onEdit: (profile: GitProfile) => void;
  onDelete: (id: string) => void;
}

export const ProfilesManagerModal: React.FC<ProfilesManagerModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onAddNew,
  onEdit,
  onDelete,
}) => {
  if (!isOpen) return null;

  const handleOpenRaw = async () => {
    try {
      await invoke("open_profiles_json");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--cc-text-primary)" }}>
            Gestion des Profils
          </h3>
          <button className="cc-bottom-link" style={{ width: "auto", padding: "4px" }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
          {profiles.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "8px",
                border: "0.5px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--cc-text-primary)" }}>
                  {p.name}
                </span>
                <span style={{ fontSize: "10.5px", color: "var(--cc-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {p.git_email}
                </span>
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                  }}
                  onClick={() => onEdit(p)}
                >
                  <Edit2 size={11} />
                  Modifier
                </button>

                <button
                  style={{
                    background: "rgba(255, 69, 58, 0.15)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    color: "#ff453a",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                  }}
                  onClick={() => onDelete(p.id)}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="cc-row"
          style={{
            justifyContent: "center",
            gap: "6px",
            background: "rgba(168, 85, 247, 0.15)",
            border: "0.5px solid rgba(168, 85, 247, 0.3)",
            color: "white",
            marginTop: "6px",
          }}
          onClick={onAddNew}
        >
          <Plus size={14} />
          <span style={{ fontSize: "12px", fontWeight: 600 }}>Ajouter un profil</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
          <button
            type="button"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--cc-text-muted)",
              fontSize: "10.5px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
            onClick={handleOpenRaw}
            title="Ouvrir profiles.json dans votre éditeur"
          >
            <Code size={11} />
            Fichier profiles.json
          </button>

          <button
            type="button"
            className="cc-badge"
            style={{ cursor: "pointer", padding: "5px 12px" }}
            onClick={onClose}
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
