
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import { Message } from '@/types/messaging';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MessageListProps {
  userId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
}

export function MessageList({ userId, otherUserId, otherUserName, otherUserAvatar }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch messages on component mount and when selected user changes
  useEffect(() => {
    async function fetchMessages() {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
          return;
        }

        setMessages(data || []);
        
        // Mark received messages as read
        const unreadMessageIds = data
          ?.filter(msg => msg.sender_id === otherUserId && msg.receiver_id === userId && !msg.read)
          .map(msg => msg.id);
        
        if (unreadMessageIds && unreadMessageIds.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessageIds);
        }
      } catch (error) {
        console.error("Error in message fetching:", error);
      } finally {
        setIsLoading(false);
        // Scroll to bottom after messages load
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }

    if (userId && otherUserId) {
      fetchMessages();
    }
  }, [userId, otherUserId]);

  // Set up realtime subscription for new messages
  useRealtime<Message>('public', 'messages', 'INSERT', (payload) => {
    const message = payload.new;
    
    // Only add messages that belong to this conversation
    if ((message.sender_id === userId && message.receiver_id === otherUserId) ||
        (message.sender_id === otherUserId && message.receiver_id === userId)) {
      setMessages(prev => [...prev, message]);
      
      // Mark received messages as read
      if (message.sender_id === otherUserId && message.receiver_id === userId && !message.read) {
        supabase
          .from('messages')
          .update({ read: true })
          .eq('id', message.id)
          .then(() => {
            // Message marked as read
          })
          .catch(error => {
            console.error("Error marking message as read:", error);
          });
      }
      
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  });

  // Handle delete message
  const handleDeleteMessage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id)
        .eq('sender_id', userId); // Make sure user can only delete their own messages
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete message. Please try again.",
          variant: "destructive"
        });
        console.error("Error deleting message:", error);
        return;
      }
      
      setMessages(prev => prev.filter(msg => msg.id !== id));
      
      toast({
        title: "Success",
        description: "Message deleted successfully.",
      });
    } catch (error) {
      console.error("Error in message deletion:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
    
    setMessageToDelete(null);
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-260px)] p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Start the conversation by sending a message
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === userId;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} gap-2 group`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={otherUserAvatar} alt={otherUserName} />
                      <AvatarFallback>{otherUserName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="max-w-[70%] flex">
                    <div
                      className={`rounded-lg p-3 ${
                        isOwnMessage 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-muted rounded-bl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="text-xs mt-1 opacity-70 flex justify-between">
                        <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
                        {message.read && isOwnMessage && <span>Read</span>}
                      </div>
                    </div>
                    
                    {isOwnMessage && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setMessageToDelete(message.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 self-start"
                        aria-label="Delete message"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
