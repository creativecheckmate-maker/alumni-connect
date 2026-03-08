'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LogOut, Trash2, Shield, Bell, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth, useFirestore, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function SettingsPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser || !firestore) return;

    setIsDeleting(true);
    try {
      // 1. Attempt Auth Deletion first (Requires recent login)
      // This is the primary record. If this fails, we stop to prevent a missing-profile state.
      await deleteUser(currentUser);

      // 2. If Auth deletion succeeds, purge Firestore data
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      deleteDocumentNonBlocking(userDocRef);
      
      toast({ 
        title: "Account Purged", 
        description: "Your identity and credentials have been permanently removed from the network." 
      });
      router.push('/login');
    } catch (error: any) {
      console.error("Deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast({ 
          variant: 'destructive', 
          title: "Security Timeout", 
          description: "For security, please sign out and sign back in immediately before attempting to delete your identity." 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: "Critical Error", 
          description: "System failed to process account purge. Please contact an administrator." 
        });
      }
    } finally {
      setIsDeleting(false);
    }
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

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
                variant="ghost" 
                disabled={isDeleting}
                className="w-full justify-between h-12 rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <span className="font-bold">Delete Account Permanently</span>
              {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Irreversible Operation
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently scrub your profile and credentials from the Nexus network. 
                You will be able to sign up again with the same email, but all your history will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                Confirm Purge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
