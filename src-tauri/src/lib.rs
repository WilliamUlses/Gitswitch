use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::{
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitProfile {
    pub id: String,
    pub name: String,
    pub git_name: String,
    pub git_email: String,
    pub ssh_key_path: Option<String>,
    pub gh_user: Option<String>,
    pub signing_key: Option<String>,
    pub color: String,
    pub icon: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemState {
    pub git_name: Option<String>,
    pub git_email: Option<String>,
    pub git_signing_key: Option<String>,
    pub gh_current_user: Option<String>,
    pub ssh_loaded_keys: Vec<String>,
    pub matched_profile_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwitchResult {
    pub success: bool,
    pub message: String,
    pub git_updated: bool,
    pub ssh_updated: bool,
    pub gh_updated: bool,
    pub warnings: Vec<String>,
}

fn get_config_dir() -> PathBuf {
    if let Ok(home) = std::env::var("HOME") {
        PathBuf::from(home).join(".config").join("gitswitch")
    } else {
        PathBuf::from(".gitswitch")
    }
}

fn get_config_file_path() -> PathBuf {
    get_config_dir().join("profiles.json")
}

fn expand_tilde(path_str: &str) -> String {
    if path_str.starts_with("~/") || path_str == "~" {
        if let Ok(home) = std::env::var("HOME") {
            return path_str.replacen('~', &home, 1);
        }
    }
    path_str.to_string()
}

fn send_mac_notification(title: &str, message: &str) {
    let script = format!(
        "display notification \"{}\" with title \"{}\"",
        message.replace('"', "\\\""),
        title.replace('"', "\\\"")
    );
    let _ = Command::new("osascript").args(["-e", &script]).spawn();
}

fn read_git_config(key: &str) -> Option<String> {
    let output = Command::new("git")
        .args(["config", "--global", key])
        .output()
        .ok()?;

    if output.status.success() {
        let val = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !val.is_empty() {
            return Some(val);
        }
    }
    None
}

fn read_gh_current_user() -> Option<String> {
    // 1. Instant local file check in ~/.config/gh/hosts.yml (< 0.1ms)
    if let Ok(home) = std::env::var("HOME") {
        let hosts_path = PathBuf::from(home).join(".config/gh/hosts.yml");
        if let Ok(content) = fs::read_to_string(hosts_path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("user:") {
                    let parts: Vec<&str> = trimmed.split(':').collect();
                    if parts.len() >= 2 {
                        let user = parts[1].trim().to_string();
                        if !user.is_empty() {
                            return Some(user);
                        }
                    }
                }
            }
        }
    }
    None
}

fn read_git_config_fast() -> (Option<String>, Option<String>, Option<String>) {
    let mut name = None;
    let mut email = None;
    let mut signing_key = None;

    if let Ok(home) = std::env::var("HOME") {
        let gitconfig_path = PathBuf::from(home).join(".gitconfig");
        if let Ok(content) = fs::read_to_string(gitconfig_path) {
            let mut in_user_section = false;
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with('[') {
                    in_user_section = trimmed == "[user]";
                    continue;
                }
                if in_user_section {
                    if let Some(idx) = trimmed.find('=') {
                        let key = trimmed[..idx].trim();
                        let val = trimmed[idx + 1..].trim();
                        if key == "name" && !val.is_empty() {
                            name = Some(val.to_string());
                        } else if key == "email" && !val.is_empty() {
                            email = Some(val.to_string());
                        } else if key == "signingkey" && !val.is_empty() {
                            signing_key = Some(val.to_string());
                        }
                    }
                }
            }
        }
    }

    if name.is_none() {
        name = read_git_config("user.name");
    }
    if email.is_none() {
        email = read_git_config("user.email");
    }

    (name, email, signing_key)
}

fn read_loaded_ssh_keys() -> Vec<String> {
    let mut list = Vec::new();
    if let Ok(output) = Command::new("ssh-add").arg("-l").output() {
        let text = String::from_utf8_lossy(&output.stdout);
        for line in text.lines() {
            let trimmed = line.trim();
            if !trimmed.is_empty() && !trimmed.contains("The agent has no identities") {
                list.push(trimmed.to_string());
            }
        }
    }
    list
}

fn get_default_profiles() -> Vec<GitProfile> {
    vec![
        GitProfile {
            id: "work".to_string(),
            name: "Pro (Work)".to_string(),
            git_name: "work-dev".to_string(),
            git_email: "dev@company.com".to_string(),
            ssh_key_path: Some("~/.ssh/id_ed25519_work".to_string()),
            gh_user: Some("work-dev".to_string()),
            signing_key: None,
            color: "#a855f7".to_string(),
            icon: "briefcase".to_string(),
        },
        GitProfile {
            id: "perso".to_string(),
            name: "Perso (Personal)".to_string(),
            git_name: "personal-dev".to_string(),
            git_email: "personal@example.com".to_string(),
            ssh_key_path: Some("~/.ssh/id_ed25519_perso".to_string()),
            gh_user: Some("personal-dev".to_string()),
            signing_key: None,
            color: "#3b82f6".to_string(),
            icon: "user".to_string(),
        },
    ]
}

#[tauri::command]
fn get_profiles() -> Result<Vec<GitProfile>, String> {
    let path = get_config_file_path();
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let profiles: Vec<GitProfile> = serde_json::from_str(&content).unwrap_or_else(|_| get_default_profiles());
        return Ok(profiles);
    }

    let defaults = get_default_profiles();
    let dir = get_config_dir();
    let _ = fs::create_dir_all(&dir);
    if let Ok(json) = serde_json::to_string_pretty(&defaults) {
        let _ = fs::write(&path, json);
    }
    Ok(defaults)
}

#[tauri::command]
fn save_profile(profile: GitProfile) -> Result<Vec<GitProfile>, String> {
    let mut profiles = get_profiles().unwrap_or_else(|_| Vec::new());
    if let Some(pos) = profiles.iter().position(|p| p.id == profile.id) {
        profiles[pos] = profile;
    } else {
        profiles.push(profile);
    }

    let dir = get_config_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&profiles).map_err(|e| e.to_string())?;
    fs::write(get_config_file_path(), json).map_err(|e| e.to_string())?;

    Ok(profiles)
}

#[tauri::command]
fn delete_profile(id: String) -> Result<Vec<GitProfile>, String> {
    let mut profiles = get_profiles().unwrap_or_else(|_| Vec::new());
    profiles.retain(|p| p.id != id);

    let dir = get_config_dir();
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(&profiles).map_err(|e| e.to_string())?;
    fs::write(get_config_file_path(), json).map_err(|e| e.to_string())?;

    Ok(profiles)
}

#[tauri::command]
fn get_system_state() -> Result<SystemState, String> {
    let (git_name, git_email, git_signing_key) = read_git_config_fast();
    let gh_current_user = read_gh_current_user();
    let ssh_loaded_keys = read_loaded_ssh_keys();

    let profiles = get_profiles().unwrap_or_default();
    let mut matched_id = None;

    if let (Some(ref cur_name), Some(ref cur_email)) = (&git_name, &git_email) {
        for p in &profiles {
            if &p.git_name == cur_name && &p.git_email == cur_email {
                matched_id = Some(p.id.clone());
                break;
            }
        }
    }

    Ok(SystemState {
        git_name,
        git_email,
        git_signing_key,
        gh_current_user,
        ssh_loaded_keys,
        matched_profile_id: matched_id,
    })
}

#[tauri::command]
fn switch_profile(id: String) -> Result<SwitchResult, String> {
    let profiles = get_profiles().map_err(|e| e.to_string())?;
    let profile = profiles
        .into_iter()
        .find(|p| p.id == id)
        .ok_or_else(|| format!("Profil '{}' introuvable", id))?;

    let mut warnings = Vec::new();
    let mut git_ok = false;
    let mut ssh_ok = false;
    let mut gh_ok = false;

    // 1. Git config --global user.name & user.email
    let set_name = Command::new("git")
        .args(["config", "--global", "user.name", &profile.git_name])
        .output();
    let set_email = Command::new("git")
        .args(["config", "--global", "user.email", &profile.git_email])
        .output();

    if let (Ok(n), Ok(e)) = (set_name, set_email) {
        if n.status.success() && e.status.success() {
            git_ok = true;
        } else {
            warnings.push("Impossible de modifier git config".to_string());
        }
    }

    // 2. SSH key (spawn non-blocking for instant return)
    if let Some(ref key_path) = profile.ssh_key_path {
        let expanded = expand_tilde(key_path);
        if Path::new(&expanded).exists() {
            let _ = Command::new("ssh-add").arg(&expanded).spawn();
            ssh_ok = true;
        }
    } else {
        ssh_ok = true;
    }

    // 3. GitHub CLI (skip if already active)
    if let Some(ref gh_user) = profile.gh_user {
        if !gh_user.is_empty() {
            let cur = read_gh_current_user();
            if cur.as_deref() != Some(gh_user) {
                let _ = Command::new("gh")
                    .args(["auth", "switch", "--user", gh_user])
                    .output();
            }
            gh_ok = true;
        }
    } else {
        gh_ok = true;
    }

    send_mac_notification("GitSwitch", &format!("Profil « {} » activé", profile.name));

    Ok(SwitchResult {
        success: git_ok,
        message: format!("Profil « {} » activé", profile.name),
        git_updated: git_ok,
        ssh_updated: ssh_ok,
        gh_updated: gh_ok,
        warnings,
    })
}

#[tauri::command]
fn test_github_ssh() -> Result<String, String> {
    // 1. Check GitHub CLI authentication
    let gh_res = Command::new("gh").args(["api", "user", "--jq", ".login"]).output();
    let mut gh_info = String::new();
    if let Ok(out) = gh_res {
        if out.status.success() {
            let u = String::from_utf8_lossy(&out.stdout).trim().to_string();
            gh_info = format!("✓ GitHub CLI : Connecté (@{})", u);
        }
    }

    // 2. Check SSH status
    let ssh_out = Command::new("ssh")
        .args(["-T", "-o", "ConnectTimeout=3", "git@github.com"])
        .output();

    let ssh_info = match ssh_out {
        Ok(out) => {
            let text = format!(
                "{}{}",
                String::from_utf8_lossy(&out.stdout),
                String::from_utf8_lossy(&out.stderr)
            );
            if text.contains("successfully authenticated") || text.contains("Hi ") {
                let first_line = text.lines().find(|l| !l.is_empty()).unwrap_or("Connecté");
                format!("✓ SSH : {}", first_line)
            } else if text.contains("Permission denied") {
                "ℹ️ SSH : Aucune clé (HTTPS actif)".to_string()
            } else {
                text.trim().to_string()
            }
        }
        Err(e) => format!("SSH: {}", e),
    };

    if !gh_info.is_empty() {
        Ok(format!("{}\n{}", gh_info, ssh_info))
    } else {
        Ok(ssh_info)
    }
}

#[tauri::command]
fn open_gitconfig() -> Result<(), String> {
    if let Ok(home) = std::env::var("HOME") {
        let path = format!("{}/.gitconfig", home);
        let _ = Command::new("open").arg(path).spawn();
    }
    Ok(())
}

#[tauri::command]
fn open_ssh_folder() -> Result<(), String> {
    if let Ok(home) = std::env::var("HOME") {
        let path = format!("{}/.ssh", home);
        let _ = Command::new("open").arg(path).spawn();
    }
    Ok(())
}

#[tauri::command]
fn open_profiles_json() -> Result<(), String> {
    let path = get_config_file_path();
    let _ = Command::new("open").arg(path).spawn();
    Ok(())
}

#[tauri::command]
fn update_git_config(name: String, email: String) -> Result<(), String> {
    let _ = Command::new("git").args(["config", "--global", "user.name", &name]).output();
    let _ = Command::new("git").args(["config", "--global", "user.email", &email]).output();
    Ok(())
}

#[tauri::command]
fn hide_window(window: tauri::Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let mut tray_builder = TrayIconBuilder::with_id("tray")
                .tooltip("GitSwitch")
                .icon_as_template(true)
                .show_menu_on_left_click(false);

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let tray = tray_builder
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        rect,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let is_visible = window.is_visible().unwrap_or(false);
                            println!("[GitSwitch] Click Up! Current is_visible = {}", is_visible);

                            if is_visible {
                                let _ = window.hide();
                            } else {
                                let scale = window.scale_factor().unwrap_or(2.0);
                                let pos = rect.position.to_logical::<f64>(scale);
                                let size = rect.size.to_logical::<f64>(scale);
                                let win_width = 320.0;

                                println!("[GitSwitch] Calculated: scale={}, pos={:?}, size={:?}", scale, pos, size);

                                let mut x = pos.x + (size.width / 2.0) - (win_width / 2.0);
                                let y = pos.y + size.height + 4.0;

                                // Prevent window going off screen
                                if let Ok(Some(monitor)) = window.primary_monitor() {
                                    let mon_size = monitor.size().to_logical::<f64>(scale);
                                    if x + win_width > mon_size.width {
                                        x = mon_size.width - win_width - 10.0;
                                    }
                                }

                                println!("[GitSwitch] Setting window position: x={}, y={}", x, y);
                                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition::new(x, y)));
                                let _ = window.set_always_on_top(true);
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            let _ = tray;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_profiles,
            save_profile,
            delete_profile,
            get_system_state,
            switch_profile,
            test_github_ssh,
            open_gitconfig,
            open_ssh_folder,
            open_profiles_json,
            update_git_config,
            hide_window,
            quit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
