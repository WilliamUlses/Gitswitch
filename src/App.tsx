import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GitProfile, SystemState, SwitchResult } from "./types";
import { playSwitchSound, playSuccessSound } from "./utils/audio";
import { GitSettingsModal } from "./components/GitSettingsModal";
import { ProfilesManagerModal } from "./components/ProfilesManagerModal";
import { ProfileModal } from "./components/ProfileModal";
import {
  Briefcase,
  User,
  ShieldCheck,
  Key,
  Check,
  Terminal,
  Settings,
  ChevronRight,
  Power,
  Users,
} from "lucide-react";

type ActiveModal = "none" | "git-settings" | "profiles-manager" | "profile-editor";

export function App() {
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [profiles, setProfiles] = useState<GitProfile[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [sshOutput, setSshOutput] = useState<string | null>(null);
  const [testingSsh, setTestingSsh] = useState(false);
  const [editingProfile, setEditingProfile] = useState<GitProfile | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [loadedProfiles, loadedState] = await Promise.all([
        invoke<GitProfile[]>("get_profiles"),
        invoke<SystemState>("get_system_state"),
      ]);
      setProfiles(loadedProfiles);
      setSystemState(loadedState);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeModal === "profile-editor") {
          setActiveModal("profiles-manager");
        } else if (activeModal !== "none") {
          setActiveModal("none");
        } else {
          invoke("hide_window").catch(console.error);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadData, activeModal]);

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

  const handleSaveProfile = async (toSave: GitProfile) => {
    try {
      const updated = await invoke<GitProfile[]>("save_profile", { profile: toSave });
      setProfiles(updated);
      await loadData();
      setActiveModal("profiles-manager");
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

  const handleQuit = async () => {
    try {
      await invoke("quit_app");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="control-center-panel" style={{ position: "relative" }}>
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
      <button className="cc-bottom-link" onClick={() => setActiveModal("git-settings")}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Settings size={13} color="var(--cc-text-muted)" />
          <span>Réglages Git...</span>
        </div>
        <ChevronRight size={13} color="var(--cc-text-muted)" />
      </button>

      <button className="cc-bottom-link" onClick={() => setActiveModal("profiles-manager")}>
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

      {/* ============================================================
          TRUE MODAL OVERLAYS (MUTUALLY EXCLUSIVE, FROSTED GLASS BACKDROP)
          ============================================================ */}
      <GitSettingsModal
        isOpen={activeModal === "git-settings"}
        onClose={() => setActiveModal("none")}
        systemState={systemState}
        onRefresh={loadData}
      />

      <ProfilesManagerModal
        isOpen={activeModal === "profiles-manager"}
        onClose={() => setActiveModal("none")}
        profiles={profiles}
        onAddNew={() => {
          setEditingProfile(null);
          setActiveModal("profile-editor");
        }}
        onEdit={(p) => {
          setEditingProfile(p);
          setActiveModal("profile-editor");
        }}
        onDelete={handleDeleteProfile}
      />

      <ProfileModal
        isOpen={activeModal === "profile-editor"}
        profile={editingProfile}
        onClose={() => setActiveModal("profiles-manager")}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

export default App;
