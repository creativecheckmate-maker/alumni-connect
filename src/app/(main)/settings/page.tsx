'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ADMIN_EMAIL } from '@/lib/config';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const handleDeactivateAccount = async () => {
    if (!user || !firestore || !auth) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not deactivate account. Please try again.' });
      return;
    }
    setIsDeactivating(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { status: 'deactivated', isVisibleInDirectory: false });
      await signOut(auth);
      toast({ title: 'Account Deactivated', description: 'Your account has been deactivated and you have been logged out.' });
      router.push('/login');
    } catch (error) {
      console.error("Deactivation error:", error);
      toast({ variant: 'destructive', title: 'Deactivation Failed', description: 'An unexpected error occurred.' });
      setIsDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete account. User not found.' });
      return;
    }
    setIsDeleting(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await deleteDoc(userDocRef);
      await user.delete();
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
      router.push('/');
    } catch (error: any) {
      console.error("Account deletion error:", error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        description = 'This is a sensitive operation. Please log out and log back in before deleting your account.';
      }
      toast({ variant: 'destructive', title: 'Deletion Failed', description });
      setIsDeleting(false);
    }
  };

  if (isAdmin) {
    return (
        <>
            <PageHeader title="Settings" />
            <Card>
                <CardHeader>
                    <CardTitle>Admin Account</CardTitle>
                    <CardDescription>
                        Account management options are disabled for the admin user.
                    </CardDescription>
                </CardHeader>
            </Card>
        </>
    )
  }

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deactivate Account</CardTitle>
            <CardDescription>
              Temporarily deactivate your account. Your profile will be hidden and you will be logged out.
              You can reactivate your account by logging back in.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-t pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Deactivate Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to deactivate?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your profile will be hidden and you will be logged out. You can reactivate your account at any time by logging back in.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivateAccount} disabled={isDeactivating}>
                    {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all of your data. This action is irreversible.
            </CardDescription>
          </CardHeader>
          <CardFooter className="border-t pt-6">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account Permanently</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
