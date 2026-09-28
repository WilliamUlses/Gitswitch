import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Terminal,
  ShieldCheck,
  GitCommit,
  Folder,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Play,
} from "lucide-react";
import { SystemState, CommitItem } from "../types";

interface SystemInspectorProps {
  systemState: SystemState | null;
  commits: CommitItem[];
  onRefresh: () => void;
}

export const SystemInspector: React.FC<SystemInspectorProps> = ({
  systemState,
  commits,
  onRefresh,
}) => {
  const [testingSsh, setTestingSsh] = useState(false);
  const [sshOutput, setSshOutput] = useState<string | null>(null);

  const handleTestSsh = async () => {
    setTestingSsh(true);
    setSshOutput(null);
    try {
      const res = await invoke<string>("test_github_ssh");
      setSshOutput(res);
    } catch (err) {
      setSshOutput(`Erreur: ${err}`);
    } finally {
      setTestingSsh(false);
    }
  };

  const handleOpenGitConfig = async () => {
    try {
      await invoke("open_gitconfig");
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenSshFolder = async () => {
    try {
      await invoke("open_ssh_folder");
    } catch (err) {
      console.error(err);
    }
  };

  const isGitHubAuthOk = sshOutput?.includes("successfully authenticated") || sshOutput?.includes("Hi ");

  return (
    <div className="inspector-section">
      <div className="section-label">
        <span>Configuration Globale Active</span>
        <span style={{ color: "#38bdf8", cursor: "pointer", fontSize: "10px" }} onClick={onRefresh}>
          Sync OS
        </span>
      </div>

      <div className="inspector-card">
        <div className="inspector-row">
          <span className="row-key">
            <GitCommit size={13} color="#94a3b8" />
            user.name
          </span>
          <span className="row-val">{systemState?.git_name || "Non défini"}</span>
        </div>

        <div className="inspector-row">
          <span className="row-key">
            <span style={{ fontSize: "12px" }}>✉</span>
            user.email
          </span>
          <span className="row-val">{systemState?.git_email || "Non défini"}</span>
        </div>

        <div className="inspector-row">
          <span className="row-key">
            <ShieldCheck size={13} color="#94a3b8" />
            GitHub CLI
          </span>
          <span className="row-val">
            {systemState?.gh_current_user ? (
              <span style={{ color: "#38bdf8" }}>@{systemState.gh_current_user}</span>
            ) : (
              "Non connecté"
            )}
          </span>
        </div>

        <div className="inspector-row">
          <span className="row-key">
            <Terminal size={13} color="#94a3b8" />
            Clés SSH agent
          </span>
          <span className="row-val">
            {systemState?.ssh_loaded_keys && systemState.ssh_loaded_keys.length > 0
              ? `${systemState.ssh_loaded_keys.length} clé(s)`
              : "Aucune"}
          </span>
        </div>
      </div>

      {/* Test GitHub SSH Section */}
      <div className="inspector-card" style={{ gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600 }}>
            <Terminal size={14} color="#38bdf8" />
            Test de connexion GitHub SSH
          </div>
          <button
            className="btn-primary"
            style={{ padding: "4px 8px", fontSize: "10.5px" }}
            onClick={handleTestSsh}
            disabled={testingSsh}
          >
            <Play size={10} fill="currentColor" />
            {testingSsh ? "Test en cours..." : "Tester"}
          </button>
        </div>

        {sshOutput && (
          <div className="terminal-box">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              {isGitHubAuthOk ? (
                <CheckCircle2 size={13} color="#10b981" />
              ) : (
                <AlertCircle size={13} color="#f59e0b" />
              )}
              <span style={{ fontWeight: 600, color: isGitHubAuthOk ? "#10b981" : "#f59e0b" }}>
                {isGitHubAuthOk ? "Authentifié avec succès sur GitHub !" : "Retour SSH :"}
              </span>
            </div>
            <div>{sshOutput}</div>
          </div>
        )}
      </div>

      {/* Recent Commits */}
      {commits.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="section-label">Derniers commits locaux</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {commits.map((c) => (
              <div key={c.hash} className="commit-item">
                <div className="commit-top">
                  <span className="commit-hash">#{c.hash}</span>
                  <span className="commit-time">{c.relative_time}</span>
                </div>
                <div className="commit-msg">{c.message}</div>
                <div className="commit-author">
                  par <strong style={{ color: "var(--text-main)" }}>{c.author_name}</strong> ({c.author_email})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shortcut actions */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="footer-btn"
          style={{ flex: 1, justifyContent: "center", background: "rgba(255,255,255,0.05)" }}
          onClick={handleOpenGitConfig}
        >
          <FileCode size={13} />
          Éditer ~/.gitconfig
        </button>

        <button
          className="footer-btn"
          style={{ flex: 1, justifyContent: "center", background: "rgba(255,255,255,0.05)" }}
          onClick={handleOpenSshFolder}
        >
          <Folder size={13} />
          Ouvrir ~/.ssh
        </button>
      </div>
    </div>
  );
};
