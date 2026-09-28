import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { GitBranch, Minus, X, RefreshCw, Plus } from "lucide-react";
import { SystemState } from "../types";

interface HeaderProps {
  systemState: SystemState | null;
  onRefresh: () => void;
  onOpenNewProfile: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemState,
  onRefresh,
  onOpenNewProfile,
  isRefreshing,
}) => {
  const handleHide = async () => {
    try {
      await invoke("hide_window");
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuit = async () => {
    try {
      await invoke("quit_app");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon-box">
          <GitBranch size={16} strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-title">
            GitSwitch
            <span className="brand-badge">
              {systemState?.git_name ? `@${systemState.git_name}` : "v0.1"}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-btn"
          title="Ajouter un profil"
          onClick={onOpenNewProfile}
        >
          <Plus size={15} />
        </button>

        <button
          className={`icon-btn ${isRefreshing ? "spin" : ""}`}
          title="Actualiser l'état système"
          onClick={onRefresh}
        >
          <RefreshCw size={14} />
        </button>

        <button
          className="icon-btn"
          title="Masquer le popover"
          onClick={handleHide}
        >
          <Minus size={14} />
        </button>

        <button
          className="icon-btn"
          title="Quitter GitSwitch"
          onClick={handleQuit}
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};
