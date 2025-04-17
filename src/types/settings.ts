
export interface BlockedUserRecord {
  id: string;
  blocked_user_id: string;
  created_at?: string;
  profile?: {
    name: string;
  } | null;
}

export interface UserSettings {
  id: string;
  dark_mode: boolean;
  show_me: string;
  min_age: number;
  max_age: number;
  distance: number;
  created_at?: string;
  updated_at?: string;
}

export interface SettingsFormProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export interface TabProps {
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export interface PrivacyTabProps extends TabProps {
  blockedUsers: BlockedUserRecord[];
  onUnblockUser: (id: string) => void;
}
