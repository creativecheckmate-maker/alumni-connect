
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Trash2, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <PageHeader title="Settings" />

      {/* Profile Settings */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4" /> Profile Privacy
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[
              'Display Profile Picture',
              'Show Branch',
              'Show Batch',
              'Show Current Location',
              'Show Current Workplace',
              'Show Professional Experience'
            ].map((item) => (
              <div key={item} className="flex items-center space-x-3">
                <Checkbox id={item} defaultChecked />
                <Label htmlFor={item} className="text-sm font-medium leading-none cursor-pointer">
                  {item}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Notification Settings */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notification Preferences
        </h2>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Online Notification</Label>
                <p className="text-xs text-muted-foreground">Receive updates on email and phone</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Connect Requests</Label>
                <p className="text-xs text-muted-foreground">Allow users to send you connection requests</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Account Actions */}
      <section className="space-y-4 pt-4">
        <Button 
            variant="outline" 
            className="w-full justify-between h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5"
            onClick={handleLogout}
        >
          <span className="font-bold">Sign Out</span>
          <LogOut className="h-5 w-5" />
        </Button>

        <Button 
            variant="ghost" 
            className="w-full justify-between h-12 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <span className="font-bold">Delete Account Permanently</span>
          <Trash2 className="h-5 w-5" />
        </Button>
      </section>
    </div>
  );
}
