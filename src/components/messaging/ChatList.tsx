
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import { ChatUser, Message } from '@/types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ChatListProps {
  onSelectUser: (user: ChatUser) => void;
  selectedUserId?: string;
}

export function ChatList({ onSelectUser, selectedUserId }: ChatListProps) {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch chat users on component mount
  useEffect(() => {
    async function fetchCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
        return data.user.id;
      }
      return null;
    }

    async function fetchChatUsers() {
      try {
        setIsLoading(true);
        const userId = await fetchCurrentUser();
        
        if (!userId) {
          toast({
            title: "Error",
            description: "You must be logged in to view messages",
            variant: "destructive"
          });
          return;
        }

        // Get all users that current user has exchanged messages with
        const { data: sentMessages, error: sentError } = await supabase
          .from('messages')
          .select('receiver_id')
          .eq('sender_id', userId)
          .order('created_at', { ascending: false });

        const { data: receivedMessages, error: receivedError } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('receiver_id', userId)
          .order('created_at', { ascending: false });

        if (sentError || receivedError) {
          console.error("Error fetching messages:", sentError || receivedError);
          return;
        }

        // Get unique user IDs
        const uniqueUserIds = new Set([
          ...sentMessages?.map(msg => msg.receiver_id) || [],
          ...receivedMessages?.map(msg => msg.sender_id) || [],
        ]);

        if (uniqueUserIds.size === 0) {
          setIsLoading(false);
          return;
        }

        // Fetch user profiles
        const userProfiles: ChatUser[] = [];
        
        for (const chatUserId of uniqueUserIds) {
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('id', chatUserId)
            .single();

          if (!profileData) continue;

          // Get last message
          const { data: lastMessageData } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .or(`sender_id.eq.${chatUserId},receiver_id.eq.${chatUserId}`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', chatUserId)
            .eq('receiver_id', userId)
            .eq('read', false);

          userProfiles.push({
            id: profileData.id,
            name: profileData.name || 'Unknown User',
            last_message: lastMessageData?.content,
            last_message_time: lastMessageData?.created_at,
            unread_count: unreadCount || 0
          });
        }

        // Sort by last message time
        userProfiles.sort((a, b) => {
          if (!a.last_message_time) return 1;
          if (!b.last_message_time) return -1;
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });

        setChatUsers(userProfiles);
      } catch (error) {
        console.error("Error fetching chat users:", error);
        toast({
          title: "Error",
          description: "Failed to load chat users. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchChatUsers();
  }, []);

  // Set up realtime subscription for new messages
  useRealtime<Message>('public', 'messages', 'INSERT', (payload) => {
    if (!currentUserId) return;
    
    const message = payload.new;
    if (message.sender_id === currentUserId || message.receiver_id === currentUserId) {
      // Update chat list when a new message is received
      setChatUsers(prev => {
        const otherUserId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
        const userIndex = prev.findIndex(user => user.id === otherUserId);
        
        if (userIndex === -1) {
          // This is a new conversation, we need to fetch the user profile
          fetchChatUsers();
          return prev;
        }
        
        const updatedUsers = [...prev];
        const user = {...updatedUsers[userIndex]};
        
        user.last_message = message.content;
        user.last_message_time = message.created_at;
        
        if (message.sender_id !== currentUserId && !message.read) {
          user.unread_count = (user.unread_count || 0) + 1;
        }
        
        updatedUsers[userIndex] = user;
        
        // Move the user to the top of the list
        updatedUsers.splice(userIndex, 1);
        updatedUsers.unshift(user);
        
        return updatedUsers;
      });
    }
  });

  // Handle message read status updates
  useRealtime<Message>('public', 'messages', 'UPDATE', (payload) => {
    if (!currentUserId) return;
    
    const message = payload.new;
    if (message.sender_id !== currentUserId && message.receiver_id === currentUserId && message.read) {
      // Update unread count when messages are marked as read
      setChatUsers(prev => {
        const userIndex = prev.findIndex(user => user.id === message.sender_id);
        if (userIndex === -1) return prev;
        
        const updatedUsers = [...prev];
        const user = {...updatedUsers[userIndex]};
        user.unread_count = Math.max(0, (user.unread_count || 0) - 1);
        updatedUsers[userIndex] = user;
        
        return updatedUsers;
      });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading chats...</div>;
  }

  if (chatUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground">
          Get matched with someone to start chatting
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-1 p-2">
        {chatUsers.map((user) => (
          <button
            key={user.id}
            className={`flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors ${
              selectedUserId === user.id 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-muted'
            }`}
            onClick={() => onSelectUser(user)}
          >
            <Avatar>
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <p className="font-medium truncate">{user.name}</p>
                {user.last_message_time && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(user.last_message_time), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {user.last_message || 'No messages yet'}
              </p>
            </div>
            {user.unread_count && user.unread_count > 0 ? (
              <div className="flex-shrink-0 rounded-full bg-primary w-5 h-5 flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-medium">
                  {user.unread_count > 9 ? '9+' : user.unread_count}
                </span>
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
