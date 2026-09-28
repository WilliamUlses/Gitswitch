import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GitProfile, SystemState, SwitchResult } from "./types";
import { playSwitchSound, playSuccessSound } from "./utils/audio";
import { ProfileModal } from "./components/ProfileModal";
import { GitSettingsModal } from "./components/GitSettingsModal";
import { ProfilesManagerModal } from "./components/ProfilesManagerModal";
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

export function App() {
  const [profiles, setProfiles] = useState<GitProfile[]>([]);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [sshOutput, setSshOutput] = useState<string | null>(null);
  const [testingSsh, setTestingSsh] = useState(false);

  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<GitProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfilesManagerOpen, setIsProfilesManagerOpen] = useState(false);

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
        if (isProfileModalOpen || isSettingsOpen || isProfilesManagerOpen) {
          setIsProfileModalOpen(false);
          setIsSettingsOpen(false);
          setIsProfilesManagerOpen(false);
        } else {
          invoke("hide_window").catch(console.error);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadData, isProfileModalOpen, isSettingsOpen, isProfilesManagerOpen]);

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

  const handleSaveProfile = async (saved: GitProfile) => {
    try {
      const updated = await invoke<GitProfile[]>("save_profile", { profile: saved });
      setProfiles(updated);
      await loadData();
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
    <div className="control-center-panel">
      {/* 1. Header Row with Apple Toggle Switch (Identical to 'Wi-Fi' toggle) */}
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

      {/* 2. Section: Identité active (Like 'Partage de connexion' in screenshot) */}
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

      {/* 3. Section: Profils (Like 'Réseaux connus' in screenshot) */}
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

      {/* 4. Section: Outils connectés (Like 'Autres réseaux') */}
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

      {/* 5. In-App Control Links (No external IDEs or text files opened) */}
      <button className="cc-bottom-link" onClick={() => setIsSettingsOpen(true)}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Settings size={13} color="var(--cc-text-muted)" />
          <span>Réglages Git...</span>
        </div>
        <ChevronRight size={13} color="var(--cc-text-muted)" />
      </button>

      <button className="cc-bottom-link" onClick={() => setIsProfilesManagerOpen(true)}>
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

      {/* In-App Modals */}
      <GitSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemState={systemState}
        onRefresh={loadData}
      />

      <ProfilesManagerModal
        isOpen={isProfilesManagerOpen}
        onClose={() => setIsProfilesManagerOpen(false)}
        profiles={profiles}
        onAddNew={() => {
          setEditingProfile(null);
          setIsProfileModalOpen(true);
        }}
        onEdit={(p) => {
          setEditingProfile(p);
          setIsProfileModalOpen(true);
        }}
        onDelete={handleDeleteProfile}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        profile={editingProfile}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
}

export default App;
