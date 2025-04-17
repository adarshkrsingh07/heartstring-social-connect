
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/messaging';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userImages, setUserImages] = useState<string[]>([]);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!userId || !isOpen) return;
      
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          toast({
            title: "Error",
            description: "Failed to load user profile. Please try again.",
            variant: "destructive"
          });
          return;
        }

        setProfile(profileData);
        
        // Fetch user images
        const { data: imageData, error: imageError } = await supabase
          .from('user_images')
          .select('url')
          .eq('user_id', userId)
          .order('position', { ascending: true });

        if (imageError) {
          console.error("Error fetching user images:", imageError);
        } else if (imageData) {
          setUserImages(imageData.map(img => img.url));
        }
      } catch (error) {
        console.error("Error in profile fetching:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [userId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{profile?.name || 'User Profile'}</DialogTitle>
          <DialogDescription>
            {isLoading ? 'Loading profile information...' : ''}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userImages[0]} alt={profile?.name} />
                <AvatarFallback>{profile?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h2 className="mt-2 text-xl font-semibold">{profile?.name}</h2>
              
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                {profile?.age && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{profile.age} years old</span>
                  </div>
                )}
                
                {profile?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            {profile?.bio && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">About</h3>
                <p>{profile.bio}</p>
              </div>
            )}
            
            {userImages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {userImages.map((image, index) => (
                    <img 
                      key={index} 
                      src={image} 
                      alt={`${profile?.name}'s photo ${index + 1}`} 
                      className="w-full h-20 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
