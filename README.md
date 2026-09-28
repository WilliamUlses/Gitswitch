# ⚡ GitSwitch

> **Le switcher de profils Git, SSH et GitHub CLI ultra-rapide pour macOS (Barre des menus) & Windows.**

GitSwitch résout le problème classique de tout développeur qui jongle entre projets pro et perso :
- ❌ Oublier de changer son adresse email avant de commiter.
- ❌ Se faire refuser un `git push` parce que la mauvaise clé SSH est chargée dans l'agent.
- ❌ Faire des commits signés avec la mauvaise identité.
- ❌ Être connecté au mauvais compte GitHub CLI (`gh`).

Avec **GitSwitch**, un clic dans votre barre des menus bascule instantanément toute votre identité de dev.

---

## ✨ Fonctionnalités

- 🚀 **Bascule en 1 clic** :
  - `git config --global user.name` & `user.email`.
  - Chargement automatique de la clé SSH associée (`ssh-add ~/.ssh/...`).
  - Changement de compte GitHub CLI (`gh auth switch --user ...`).
  - Clé de signature GPG / SSH optionnelle (`user.signingkey`).
- 💎 **Interface Popover Haut de Gamme** :
  - Logée directement sous l'icône de la barre des menus macOS.
  - Design sombre avec effet glassmorphism (translucide façon Raycast / macOS Sonoma).
  - Micro-animations et retour sonore haptique subtil (Web Audio API native).
  - Raccourci `Échap` pour fermer en un clin d'œil.
- 🔍 **Inspecteur Système en direct** :
  - Visualisation en temps réel de votre configuration active (`~/.gitconfig`, `ssh-agent`, `gh auth`).
  - Bouton de **test de connexion SSH GitHub** en direct (`ssh -T git@github.com`).
  - Historique des derniers commits locaux avec auteur et heure relative.
- 🛠️ **Gestion Multi-Profils** :
  - Ajoutez autant de profils que vous souhaitez (Pro, Perso, Client X, Open Source).
  - Personnalisation de la couleur d'accent et de l'icône.
  - Stockage persistant et lisible dans `~/.config/gitswitch/profiles.json`.

---

## 🚀 Utilisation

### En mode Développement (avec rechargement à chaud)
```bash
npm install
npm run tauri dev
```

### Pour créer l'exécutable natif (`.app` pour macOS)
```bash
npm run tauri build
```
L'application compilée se trouvera dans `src-tauri/target/release/bundle/macos/GitSwitch.app`.
Il vous suffit de la glisser dans votre dossier `/Applications` !

---

## ⚙️ Configuration des profils

Les profils sont automatiquement initialisés avec vos identifiants existants, et sauvegardés au format JSON dans :
```bash
~/.config/gitswitch/profiles.json
```

Exemple :
```json
[
  {
    "id": "work",
    "name": "Pro (Work)",
    "git_name": "work-dev",
    "git_email": "dev@company.com",
    "ssh_key_path": "~/.ssh/id_ed25519_work",
    "gh_user": "work-dev",
    "color": "#a855f7",
    "icon": "briefcase"
  },
  {
    "id": "perso",
    "name": "Perso (Personal)",
    "git_name": "personal-dev",
    "git_email": "personal@example.com",
    "ssh_key_path": "~/.ssh/id_ed25519_perso",
    "gh_user": "personal-dev",
    "color": "#3b82f6",
    "icon": "user"
  }
]
```

---

## 🛠️ Stack Technique

- **Frontend** : React 19 + TypeScript + Vite + Vanilla CSS Glassmorphism + Lucide Icons.
- **Backend / Desktop** : Tauri v2 (Rust) avec `tray-icon` natif macOS.
- **Taille mémoire** : ~25 Mo de RAM.
