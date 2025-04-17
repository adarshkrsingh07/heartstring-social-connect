
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatUser } from '@/types/messaging';
import { ChatList } from './ChatList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { UserProfileModal } from './UserProfileModal';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function ChatInterface() {
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Get current user ID on component mount
  useEffect(() => {
    async function getCurrentUser() {
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data.user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to use chat",
          variant: "destructive"
        });
        return;
      }
      
      setCurrentUserId(data.user.id);
    }
    
    getCurrentUser();
  }, []);

  const handleSelectUser = (user: ChatUser) => {
    setSelectedUser(user);
  };

  const handleViewProfile = () => {
    if (selectedUser) {
      setIsProfileModalOpen(true);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden border rounded-lg">
      {/* Chat list sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>
        <ChatList 
          onSelectUser={handleSelectUser} 
          selectedUserId={selectedUser?.id}
        />
      </div>
      
      {/* Chat content area */}
      <div className="flex-1 flex flex-col">
        {selectedUser && currentUserId ? (
          <>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">{selectedUser.name}</h2>
              <Button variant="outline" size="sm" onClick={handleViewProfile}>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </div>
            
            <MessageList 
              userId={currentUserId}
              otherUserId={selectedUser.id}
              otherUserName={selectedUser.name}
              otherUserAvatar={selectedUser.avatar_url}
            />
            
            <MessageInput 
              userId={currentUserId}
              receiverId={selectedUser.id}
            />
            
            <UserProfileModal 
              userId={selectedUser.id}
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground">Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
