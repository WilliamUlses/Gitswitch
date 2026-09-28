export interface GitProfile {
  id: string;
  name: string;
  git_name: string;
  git_email: string;
  ssh_key_path?: string | null;
  gh_user?: string | null;
  signing_key?: string | null;
  color: string;
  icon: string;
}

export interface SystemState {
  git_name: string | null;
  git_email: string | null;
  git_signing_key: string | null;
  gh_current_user: string | null;
  ssh_loaded_keys: string[];
  matched_profile_id: string | null;
}

export interface SwitchResult {
  success: boolean;
  message: string;
  git_updated: boolean;
  ssh_updated: boolean;
  gh_updated: boolean;
  warnings: string[];
}

export interface CommitItem {
  hash: string;
  author_name: string;
  author_email: string;
  message: string;
  relative_time: string;
}
