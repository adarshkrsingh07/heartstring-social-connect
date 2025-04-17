
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PrivacyTabProps } from '@/types/settings';
import { X } from 'lucide-react';

export function PrivacyTab({ settings, onUpdateSettings, blockedUsers, onUnblockUser }: PrivacyTabProps) {
  const [showMe, setShowMe] = useState(settings.show_me);

  const handleShowMeChange = (value: string) => {
    setShowMe(value);
    onUpdateSettings({ show_me: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage who can see you and interact with your profile
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>Control who can see your profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="show-me">Show me to</Label>
            <Select value={showMe} onValueChange={handleShowMeChange}>
              <SelectTrigger id="show-me">
                <SelectValue placeholder="Select who can see you" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="none">Nobody (Pause)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>Users you've blocked won't be able to see your profile or message you</CardDescription>
        </CardHeader>
        <CardContent>
          {blockedUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven't blocked any users yet.</p>
          ) : (
            <ul className="space-y-2">
              {blockedUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between rounded-md border p-2">
                  <span>{user.profile?.name || 'Unknown User'}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onUnblockUser(user.id)}
                    aria-label={`Unblock ${user.profile?.name || 'User'}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
