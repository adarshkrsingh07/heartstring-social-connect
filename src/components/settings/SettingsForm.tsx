
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserSettings, BlockedUserRecord } from '@/types/settings';
import { AccountTab } from './tabs/AccountTab';
import { DiscoveryTab } from './tabs/DiscoveryTab';
import { NotificationsTab } from './tabs/NotificationsTab';
import { PrivacyTab } from './tabs/PrivacyTab';

export function SettingsForm() {
  const [activeTab, setActiveTab] = useState('account');
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>({
    id: '',
    dark_mode: false,
    show_me: 'everyone',
    min_age: 18,
    max_age: 50,
    distance: 50
  });
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRecord[]>([]);

  useEffect(() => {
    async function fetchUserSettings() {
      try {
        setIsLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Error",
            description: "You must be logged in to view settings",
            variant: "destructive"
          });
          return;
        }

        // Fetch user settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('id', user.id)
          .single();

        if (settingsError) {
          toast({
            title: "Error",
            description: "Failed to load settings. Please try again.",
            variant: "destructive"
          });
          console.error("Error fetching settings:", settingsError);
          return;
        }

        if (settingsData) {
          setSettings(settingsData);
        }
        
        // Fetch blocked users with their profile information
        const { data: blockedData, error: blockedError } = await supabase
          .from('blocked_users')
          .select(`
            id, 
            blocked_user_id, 
            created_at,
            profile:blocked_user_id(name)
          `)
          .eq('user_id', user.id);

        if (blockedError) {
          toast({
            title: "Error",
            description: "Failed to load blocked users.",
            variant: "destructive"
          });
          console.error("Error fetching blocked users:", blockedError);
        } else {
          setBlockedUsers(blockedData as BlockedUserRecord[]);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserSettings();
  }, []);

  const handleUpdateSettings = async (updatedSettings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update settings",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_settings')
        .update({ ...updatedSettings, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update settings. Please try again.",
          variant: "destructive"
        });
        console.error("Error updating settings:", error);
        return;
      }

      setSettings(prev => ({ ...prev, ...updatedSettings }));
      
      toast({
        title: "Success",
        description: "Settings updated successfully.",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnblockUser = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unblock user. Please try again.",
          variant: "destructive"
        });
        console.error("Error unblocking user:", error);
        return;
      }

      setBlockedUsers(prev => prev.filter(user => user.id !== id));
      
      toast({
        title: "Success",
        description: "User unblocked successfully.",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading settings...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <AccountTab settings={settings} onUpdateSettings={handleUpdateSettings} />
        </TabsContent>
        
        <TabsContent value="discovery">
          <DiscoveryTab settings={settings} onUpdateSettings={handleUpdateSettings} />
        </TabsContent>
        
        <TabsContent value="notifications">
          <NotificationsTab settings={settings} onUpdateSettings={handleUpdateSettings} />
        </TabsContent>
        
        <TabsContent value="privacy">
          <PrivacyTab 
            settings={settings} 
            onUpdateSettings={handleUpdateSettings} 
            blockedUsers={blockedUsers}
            onUnblockUser={handleUnblockUser}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
