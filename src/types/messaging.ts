
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
  image_url?: string | null;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export interface Profile {
  id: string;
  name: string;
  bio?: string;
  location?: string;
  age?: number;
  created_at?: string;
  updated_at?: string;
}
