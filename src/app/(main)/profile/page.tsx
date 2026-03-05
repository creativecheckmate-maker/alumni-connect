'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDoc, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, School, Edit, Check, Loader2, RefreshCcw, X, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { CldUploadWidget } from 'next-cloudinary';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { moderateContent } from '@/ai/flows/moderation';

const getInitials = (name: string) => {
  if (!name) return 'U';
  const names = name.trim().split(/\s+/);
  if (names.length > 1) {
    const firstInitial = names[0]?.[0] || '';
    const lastInitial = names[names.length - 1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
  }
  return (names[0]?.substring(0, 2) || 'U').toUpperCase();
};

export default function ProfilePage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const handleUploadSuccess = (result: any) => {
    const url = result?.info?.secure_url || result?.info?.url;
    if (url) {
      setNewAvatarUrl(url);
      toast({ title: "Photo Ready", description: "Review and save to update your identity." });
    }
  };

  const handleSaveAvatar = async () => {
    if (!userDocRef || !newAvatarUrl) return;
    setIsSavingAvatar(true);
    let isSafe = true;
    let moderationReason = "";

    try {
      const moderation = await moderateContent({ imageUrl: newAvatarUrl });
      isSafe = moderation.isSafe;
      moderationReason = moderation.reason || "Inappropriate imagery detected.";
    } catch (e) {
      console.warn("Avatar moderation unavailable, proceeding with standard upload.", e);
      isSafe = true; // Fallback to allow upload if AI is down
    }

    if (!isSafe) {
      toast({ variant: 'destructive', title: "Policy Violation", description: moderationReason });
      setNewAvatarUrl(null);
      setIsSavingAvatar(false);
      return;
    }

    try {
      updateDocumentNonBlocking(userDocRef, { 
        avatarUrl: newAvatarUrl,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: "Profile Updated", description: "Your professional avatar is now live across the network." });
      setNewAvatarUrl(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Sync Error", description: "Failed to update profile image." });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  if (isUserLoading || !currentUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <PageHeader title="Your Profile" />
         <Card className="overflow-hidden border-none shadow-sm"><CardContent className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <PageHeader title="Your Profile">
             <div className="flex gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2 rounded-xl h-11 font-bold shadow-sm">
                        <Edit className="h-4 w-4"/> Edit Professional Details
                        </Button>
                    </DialogTrigger>
                    <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[625px]">
                        <DialogHeader>
                            <DialogTitle>Update Profile</DialogTitle>
                            <DialogDescription>Refine your academic and professional data.</DialogDescription>
                        </DialogHeader>
                        <EditProfileForm currentUser={currentUser} />
                    </DialogContent>
                </Dialog>
             </div>
        </PageHeader>
        
        <Card className="overflow-hidden border-none shadow-2xl bg-card">
            <CardHeader className="relative flex flex-col items-center justify-center space-y-6 p-12 text-center">
                <div className="absolute top-0 left-0 w-full h-40 bg-primary/5 -z-1"></div>
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-36 w-32 md:h-48 md:w-48 border-8 border-background bg-background shadow-2xl transition-all duration-500 hover:scale-105">
                      <AvatarImage src={newAvatarUrl || currentUser.avatarUrl} alt={currentUser.name} className="object-cover" />
                      <AvatarFallback className="text-5xl font-black bg-muted">{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    
                    <CldUploadWidget
                      uploadPreset="ml_default"
                      options={{ 
                        cloudName: "dnex9nw0f",
                        cropping: true,
                        showSkipCropButton: true,
                        singleUploadAutoClose: true,
                        croppingAspectRatio: 1,
                        croppingDefaultSelection: 'transform',
                        multiple: false,
                        sources: ['local', 'url', 'camera']
                      }}
                      onSuccess={handleUploadSuccess}
                    >
                      {({ open }) => (
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="absolute bottom-2 right-2 h-14 w-14 rounded-full shadow-2xl border-4 border-background z-10 hover:bg-primary hover:text-white transition-all active:scale-95"
                          onClick={() => open()}
                        >
                          <RefreshCcw className="h-6 w-6" />
                        </Button>
                      )}
                    </CldUploadWidget>
                  </div>

                  {newAvatarUrl && (
                    <div className="flex flex-col gap-3 items-center animate-in zoom-in-95 duration-500 bg-primary/5 p-6 rounded-[2rem] border-2 border-primary/10 shadow-lg">
                        <div className="flex gap-2">
                            <Button onClick={handleSaveAvatar} disabled={isSavingAvatar} className="bg-green-600 hover:bg-green-700 shadow-xl font-black rounded-xl px-10 h-12 gap-2">
                                {isSavingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Save Profile Photo
                            </Button>
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl text-destructive border-destructive/20" onClick={() => setNewAvatarUrl(null)}><X className="h-5 w-5" /></Button>
                        </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-primary opacity-40" />
                    <CardTitle className="text-4xl font-black font-headline tracking-tight leading-none">{currentUser.name}</CardTitle>
                  </div>
                  <CardDescription className="text-lg font-medium text-muted-foreground">{currentUser.college} at {currentUser.university}</CardDescription>
                  <Badge variant={currentUser.role === 'student' ? 'secondary' : 'outline'} className="capitalize mt-3 px-6 py-1.5 text-xs font-black uppercase tracking-widest">{currentUser.role}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-12 pt-0 grid gap-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="flex items-start gap-5">
                        <div className="p-3 rounded-2xl bg-primary/5 text-primary shadow-sm"><Mail className="h-7 w-7" /></div>
                        <div className="space-y-1">
                            <h3 className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Official Email</h3>
                            <a href={`mailto:${currentUser.email}`} className="text-primary font-bold text-lg hover:underline">{currentUser.email}</a>
                        </div>
                    </div>
                    <div className="flex items-start gap-5">
                        <div className="p-3 rounded-2xl bg-primary/5 text-primary shadow-sm"><School className="h-7 w-7" /></div>
                        <div className="space-y-1">
                            <h3 className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Academic Institution</h3>
                            <p className="font-bold text-lg">{currentUser.university}</p>
                            <p className="text-muted-foreground font-medium text-sm">{currentUser.college}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}