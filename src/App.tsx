import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GitProfile, SystemState, SwitchResult } from "./types";
import { playSwitchSound, playSuccessSound } from "./utils/audio";
import {
  Briefcase,
  User,
  ShieldCheck,
  Key,
  Check,
  Terminal,
  Settings,
  ChevronRight,
  ChevronLeft,
  Power,
  Users,
  Plus,
  Edit2,
  Trash2,
  FileText,
} from "lucide-react";

type ViewMode = "main" | "git-settings" | "profiles-manager" | "profile-editor";

const THEME_COLORS = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];

export function App() {
  const [view, setView] = useState<ViewMode>("main");
  const [profiles, setProfiles] = useState<GitProfile[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [sshOutput, setSshOutput] = useState<string | null>(null);
  const [testingSsh, setTestingSsh] = useState(false);

  // Edit Git Settings state
  const [gitName, setGitName] = useState("");
  const [gitEmail, setGitEmail] = useState("");
  const [gitSavedMsg, setGitSavedMsg] = useState(false);

  // Edit Profile state
  const [editingProfile, setEditingProfile] = useState<Partial<GitProfile>>({
    name: "",
    git_name: "",
    git_email: "",
    ssh_key_path: "",
    gh_user: "",
    color: "#a855f7",
    icon: "briefcase",
  });

  const loadData = useCallback(async () => {
    try {
      const [loadedProfiles, loadedState] = await Promise.all([
        invoke<GitProfile[]>("get_profiles"),
        invoke<SystemState>("get_system_state"),
      ]);
      setProfiles(loadedProfiles);
      setSystemState(loadedState);
      if (loadedState) {
        setGitName(loadedState.git_name || "");
        setGitEmail(loadedState.git_email || "");
      }
    } catch (err) {
      console.error("Erreur de chargement:", err);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "profile-editor") {
          setView("profiles-manager");
        } else if (view !== "main") {
          setView("main");
        } else {
          invoke("hide_window").catch(console.error);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadData, view]);

  const activeProfile = profiles.find((p) => p.id === systemState?.matched_profile_id);
  const isProMode = activeProfile?.id === "work";

  const handleSwitch = async (profileId: string) => {
    if (isSwitching) return;
    setIsSwitching(true);
    playSwitchSound();

    try {
      const res = await invoke<SwitchResult>("switch_profile", { id: profileId });
      if (res.success) {
        playSuccessSound();
      }
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleTogglePro = () => {
    if (isProMode) {
      const perso = profiles.find((p) => p.id === "perso");
      if (perso) handleSwitch(perso.id);
    } else {
      const work = profiles.find((p) => p.id === "work");
      if (work) handleSwitch(work.id);
    }
  };

  const handleTestSsh = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleSaveGitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("update_git_config", { name: gitName, email: gitEmail });
      setGitSavedMsg(true);
      setTimeout(() => setGitSavedMsg(false), 2000);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile.name || !editingProfile.git_name || !editingProfile.git_email) {
      return;
    }

    const toSave: GitProfile = {
      id: editingProfile.id || `p_${Date.now()}`,
      name: editingProfile.name || "Nouveau profil",
      git_name: editingProfile.git_name || "",
      git_email: editingProfile.git_email || "",
      ssh_key_path: editingProfile.ssh_key_path ? editingProfile.ssh_key_path.trim() : null,
      gh_user: editingProfile.gh_user ? editingProfile.gh_user.trim() : null,
      signing_key: editingProfile.signing_key || null,
      color: editingProfile.color || "#a855f7",
      icon: editingProfile.icon || "briefcase",
    };

    try {
      const updated = await invoke<GitProfile[]>("save_profile", { profile: toSave });
      setProfiles(updated);
      await loadData();
      setView("profiles-manager");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (confirm("Supprimer ce profil ?")) {
      try {
        const updated = await invoke<GitProfile[]>("delete_profile", { id });
        setProfiles(updated);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleOpenRawGitConfig = async () => {
    try {
      await invoke("open_gitconfig");
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuit = async () => {
    try {
      await invoke("quit_app");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="control-center-panel">
      {/* VIEW 1: Main Control Center Widget */}
      {view === "main" && (
        <>
          {/* Header Row with Apple Toggle Switch */}
          <div className="cc-header-row">
            <div className="cc-title">
              <span>Mode Pro</span>
              <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--cc-text-muted)" }}>
                ({activeProfile ? activeProfile.git_name : "Git"})
              </span>
            </div>

            <button
              className={`apple-switch ${isProMode ? "active" : ""}`}
              onClick={handleTogglePro}
              title="Basculer Mode Pro / Perso"
            >
              <div className="apple-switch-thumb" />
            </button>
          </div>

          {/* Section: Identité active */}
          <div className="cc-section-header">Identité active</div>
          <div className="cc-row" onClick={() => loadData()}>
            <div className="cc-row-left">
              <div
                className={`cc-icon-circle ${isProMode ? "active-purple" : "active-blue"}`}
              >
                {isProMode ? <Briefcase size={14} /> : <User size={14} />}
              </div>
              <div className="cc-row-text">
                <span className="cc-row-title">{activeProfile?.name || "Profil non reconnu"}</span>
                <span className="cc-row-subtitle">{systemState?.git_email || "Email non configuré"}</span>
              </div>
            </div>
            <div className="cc-row-right">
              <span className="cc-badge">Actif</span>
            </div>
          </div>

          <div className="cc-divider" />

          {/* Section: Profils */}
          <div className="cc-section-header">Profils disponibles</div>
          {profiles.map((p) => {
            const isActive = p.id === activeProfile?.id;
            const isWork = p.id === "work";

            return (
              <div
                key={p.id}
                className="cc-row"
                onClick={() => handleSwitch(p.id)}
              >
                <div className="cc-row-left">
                  <div
                    className={`cc-icon-circle ${
                      isActive
                        ? isWork
                          ? "active-purple"
                          : "active-blue"
                        : ""
                    }`}
                  >
                    {p.icon === "briefcase" ? <Briefcase size={14} /> : <User size={14} />}
                  </div>
                  <div className="cc-row-text">
                    <span className="cc-row-title">{p.name}</span>
                    <span className="cc-row-subtitle">{p.git_email}</span>
                  </div>
                </div>
                <div className="cc-row-right">
                  {isActive ? (
                    <Check size={14} color={isWork ? "var(--cc-purple)" : "var(--cc-blue)"} strokeWidth={2.5} />
                  ) : (
                    <span style={{ fontSize: "11px", color: "var(--cc-text-muted)" }}>Activer</span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="cc-divider" />

          {/* Section: Outils connectés */}
          <div className="cc-section-header">Outils connectés</div>
          <div className="cc-row" style={{ cursor: "default" }}>
            <div className="cc-row-left">
              <div className="cc-icon-circle">
                <ShieldCheck size={14} />
              </div>
              <div className="cc-row-text">
                <span className="cc-row-title">GitHub CLI</span>
                <span className="cc-row-subtitle">
                  {systemState?.gh_current_user ? `@${systemState.gh_current_user}` : "Non connecté"}
                </span>
              </div>
            </div>
            <div className="cc-row-right">
              {systemState?.gh_current_user && <span className="cc-badge">Connecté</span>}
            </div>
          </div>

          <div className="cc-row" onClick={handleTestSsh}>
            <div className="cc-row-left">
              <div className="cc-icon-circle">
                <Terminal size={14} />
              </div>
              <div className="cc-row-text">
                <span className="cc-row-title">Test de connexion GitHub</span>
                <span className="cc-row-subtitle">
                  {testingSsh ? "Vérification en cours..." : "Cliquer pour tester la liaison"}
                </span>
              </div>
            </div>
            <div className="cc-row-right">
              <Key size={13} color="var(--cc-text-muted)" />
            </div>
          </div>

          {sshOutput && (
            <div className="ssh-test-box" style={{ whiteSpace: "pre-line", lineHeight: 1.5 }}>
              {sshOutput}
            </div>
          )}

          <div className="cc-divider" />

          {/* Bottom Navigation Links */}
          <button className="cc-bottom-link" onClick={() => setView("git-settings")}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Settings size={13} color="var(--cc-text-muted)" />
              <span>Réglages Git...</span>
            </div>
            <ChevronRight size={13} color="var(--cc-text-muted)" />
          </button>

          <button className="cc-bottom-link" onClick={() => setView("profiles-manager")}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={13} color="var(--cc-text-muted)" />
              <span>Gérer les profils ({profiles.length})...</span>
            </div>
            <ChevronRight size={13} color="var(--cc-text-muted)" />
          </button>

          <button className="cc-bottom-link" onClick={handleQuit} style={{ color: "#ff453a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Power size={13} color="#ff453a" />
              <span>Quitter GitSwitch</span>
            </div>
          </button>
        </>
      )}

      {/* VIEW 2: Subview - Réglages Git */}
      {view === "git-settings" && (
        <div className="cc-subview">
          <div className="cc-nav-bar">
            <button className="cc-back-btn" onClick={() => setView("main")}>
              <ChevronLeft size={16} />
              <span>Retour</span>
            </button>
            <span className="cc-nav-title">Réglages Git</span>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ fontSize: "11px", color: "var(--cc-text-muted)", padding: "0 2px" }}>
            Identité globale active dans votre fichier <code>~/.gitconfig</code> :
          </div>

          <form onSubmit={handleSaveGitSettings} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="apple-group-card">
              <div className="apple-field-row">
                <label className="apple-field-label">Nom Git (user.name)</label>
                <input
                  type="text"
                  className="apple-field-input"
                  value={gitName}
                  onChange={(e) => setGitName(e.target.value)}
                  placeholder="ex: Alex Dev"
                  required
                />
              </div>

              <div className="apple-field-row">
                <label className="apple-field-label">Email Git (user.email)</label>
                <input
                  type="email"
                  className="apple-field-input"
                  value={gitEmail}
                  onChange={(e) => setGitEmail(e.target.value)}
                  placeholder="ex: alex@company.com"
                  required
                />
              </div>
            </div>

            <button type="submit" className="apple-btn-primary">
              {gitSavedMsg ? <Check size={14} /> : null}
              {gitSavedMsg ? "Enregistré !" : "Appliquer à ~/.gitconfig"}
            </button>
          </form>

          <div className="cc-divider" style={{ marginTop: "auto" }} />

          <button
            type="button"
            className="cc-bottom-link"
            style={{ fontSize: "11.5px", color: "var(--cc-text-muted)" }}
            onClick={handleOpenRawGitConfig}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText size={12} />
              <span>Ouvrir ~/.gitconfig brut</span>
            </div>
            <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* VIEW 3: Subview - Gestion des Profils */}
      {view === "profiles-manager" && (
        <div className="cc-subview">
          <div className="cc-nav-bar">
            <button className="cc-back-btn" onClick={() => setView("main")}>
              <ChevronLeft size={16} />
              <span>Retour</span>
            </button>
            <span className="cc-nav-title">Profils</span>
            <button
              className="cc-back-btn"
              style={{ color: "var(--cc-purple)" }}
              onClick={() => {
                setEditingProfile({
                  name: "",
                  git_name: "",
                  git_email: "",
                  ssh_key_path: "",
                  gh_user: "",
                  color: "#a855f7",
                  icon: "briefcase",
                });
                setView("profile-editor");
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, overflowY: "auto" }}>
            {profiles.map((p) => (
              <div
                key={p.id}
                className="apple-group-card"
                style={{ padding: "8px 10px", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--cc-text-primary)" }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: "10.5px", color: "var(--cc-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {p.git_email}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    className="cc-badge"
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    onClick={() => {
                      setEditingProfile(p);
                      setView("profile-editor");
                    }}
                  >
                    <Edit2 size={10} />
                    Éditer
                  </button>
                  <button
                    className="cc-badge"
                    style={{ cursor: "pointer", color: "#ff453a" }}
                    onClick={() => handleDeleteProfile(p.id)}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="apple-btn-primary"
            style={{ marginTop: "auto" }}
            onClick={() => {
              setEditingProfile({
                name: "",
                git_name: "",
                git_email: "",
                ssh_key_path: "",
                gh_user: "",
                color: "#a855f7",
                icon: "briefcase",
              });
              setView("profile-editor");
            }}
          >
            <Plus size={14} />
            <span>Nouveau Profil</span>
          </button>
        </div>
      )}

      {/* VIEW 4: Subview - Éditeur de Profil */}
      {view === "profile-editor" && (
        <div className="cc-subview">
          <div className="cc-nav-bar">
            <button className="cc-back-btn" onClick={() => setView("profiles-manager")}>
              <ChevronLeft size={16} />
              <span>Annuler</span>
            </button>
            <span className="cc-nav-title">
              {editingProfile.id ? "Modifier le Profil" : "Nouveau Profil"}
            </span>
            <div style={{ width: 40 }} />
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto" }}>
            <div className="apple-group-card">
              <div className="apple-field-row">
                <label className="apple-field-label">Titre du Profil (ex: Pro / Client)</label>
                <input
                  type="text"
                  className="apple-field-input"
                  value={editingProfile.name || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  placeholder="ex: Pro (Entreprise)"
                  required
                />
              </div>

              <div className="apple-field-row">
                <label className="apple-field-label">Git user.name</label>
                <input
                  type="text"
                  className="apple-field-input"
                  value={editingProfile.git_name || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, git_name: e.target.value })}
                  placeholder="ex: dev-user"
                  required
                />
              </div>

              <div className="apple-field-row">
                <label className="apple-field-label">Git user.email</label>
                <input
                  type="email"
                  className="apple-field-input"
                  value={editingProfile.git_email || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, git_email: e.target.value })}
                  placeholder="ex: dev@company.com"
                  required
                />
              </div>
            </div>

            <div className="apple-group-card">
              <div className="apple-field-row">
                <label className="apple-field-label">GitHub CLI (optionnel)</label>
                <input
                  type="text"
                  className="apple-field-input"
                  value={editingProfile.gh_user || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, gh_user: e.target.value })}
                  placeholder="ex: github-username"
                />
              </div>

              <div className="apple-field-row">
                <label className="apple-field-label">Clé SSH (optionnel)</label>
                <input
                  type="text"
                  className="apple-field-input"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                  value={editingProfile.ssh_key_path || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, ssh_key_path: e.target.value })}
                  placeholder="~/.ssh/id_ed25519"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", padding: "4px 0" }}>
              {THEME_COLORS.map((c) => (
                <div
                  key={c}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: c,
                    cursor: "pointer",
                    border: editingProfile.color === c ? "2px solid white" : "2px solid transparent",
                    transform: editingProfile.color === c ? "scale(1.2)" : "scale(1)",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setEditingProfile({ ...editingProfile, color: c })}
                />
              ))}
            </div>

            <button type="submit" className="apple-btn-primary" style={{ marginTop: "auto" }}>
              <Check size={14} />
              <span>Enregistrer le Profil</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
