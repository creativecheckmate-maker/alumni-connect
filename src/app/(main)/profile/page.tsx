
'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User, Student, Professor } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Briefcase, GraduationCap, BrainCircuit, School, Edit, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { CldUploadWidget } from 'next-cloudinary';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (!names[0]) return '';
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
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
    if (result.event === 'success' && result.info?.secure_url) {
      setNewAvatarUrl(result.info.secure_url);
      toast({
        title: "Image Uploaded",
        description: "Click 'Save Profile Photo' to update your account permanently.",
      });
    }
  };

  const handleSaveAvatar = async () => {
    if (!userDocRef || !newAvatarUrl) return;
    setIsSavingAvatar(true);
    try {
      updateDocumentNonBlocking(userDocRef, { avatarUrl: newAvatarUrl });
      toast({
        title: "Profile Updated",
        description: "Your new picture is now live for all users in real-time.",
      });
      setNewAvatarUrl(null);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save image." });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  if (isUserLoading || !currentUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <PageHeader title="Your Profile" />
         <Card className="overflow-hidden">
            <CardHeader className="relative flex flex-col items-center justify-center space-y-4 bg-card p-6 text-center">
                <div className="absolute top-0 left-0 w-full h-24 bg-primary/10 -z-1"></div>
                <Skeleton className="h-32 w-32 rounded-full border-4 border-background bg-background shadow-md" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-6 w-20 mt-2" />
                </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-6">
                 <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <PageHeader title="Your Profile">
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2"><Edit className="h-4 w-4"/>Edit Details</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Edit Professional Profile</DialogTitle>
                        <DialogDescription>
                            Keep your academic and professional details updated for the AI recommendation engine.
                        </DialogDescription>
                    </DialogHeader>
                    <EditProfileForm currentUser={currentUser} />
                </DialogContent>
            </Dialog>
        </PageHeader>
        
        <Card className="overflow-hidden border-none shadow-xl">
            <CardHeader className="relative flex flex-col items-center justify-center space-y-6 bg-card p-10 text-center">
                <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 -z-1"></div>
                
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-8 border-background bg-background shadow-2xl transition-transform duration-500 group-hover:scale-105">
                      <AvatarImage src={newAvatarUrl || currentUser.avatarUrl} alt={currentUser.name} />
                      <AvatarFallback className="text-4xl font-black bg-muted">{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "nexus_alumni"}
                      options={{ cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME }}
                      onSuccess={handleUploadSuccess}
                    >
                      {({ open }) => (
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          className="absolute bottom-2 right-2 h-10 w-10 rounded-full shadow-lg border-2 border-background z-10"
                          onClick={() => open()}
                        >
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                      )}
                    </CldUploadWidget>
                  </div>

                  {newAvatarUrl && (
                    <Button 
                      onClick={handleSaveAvatar} 
                      disabled={isSavingAvatar}
                      className="bg-green-600 hover:bg-green-700 animate-in zoom-in-95 duration-300 shadow-lg font-bold"
                    >
                      {isSavingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Save Profile Photo
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-4xl font-bold font-headline tracking-tight">{currentUser.name}</CardTitle>
                  <CardDescription className="text-lg font-medium">{currentUser.college} at {currentUser.university}</CardDescription>
                  <Badge variant={currentUser.role === 'student' ? 'secondary' : 'outline'} className="capitalize mt-2 px-4 py-1 text-sm font-bold uppercase tracking-wider">{currentUser.role}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-10 grid gap-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-primary/5 text-primary">
                          <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Direct Contact</h3>
                            <a href={`mailto:${currentUser.email}`} className="text-primary font-bold text-base hover:underline">{currentUser.email}</a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-primary/5 text-primary">
                          <School className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Institution</h3>
                            <p className="font-bold text-base">{currentUser.university}</p>
                            <p className="text-muted-foreground font-medium">{currentUser.college}</p>
                        </div>
                    </div>

                    {currentUser.role === 'student' ? (
                    <>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-xl bg-primary/5 text-primary">
                              <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Academic Major</h3>
                                <p className="font-bold text-base">{(currentUser as Student).major}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-xl bg-primary/5 text-primary">
                              <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Graduation Batch</h3>
                                <p className="font-bold text-base">Class of {(currentUser as Student).graduationYear}</p>
                            </div>
                        </div>
                    </>
                    ) : (
                    <>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-xl bg-primary/5 text-primary">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Department</h3>
                                <p className="font-bold text-base">{(currentUser as Professor).department}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-xl bg-primary/5 text-primary">
                              <BrainCircuit className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest mb-1">Expertise Areas</h3>
                                <p className="font-bold text-base">{(currentUser as Professor).researchInterests?.join(', ') || 'General'}</p>
                            </div>
                        </div>
                    </>
                    )}
                </div>
    
                {currentUser.preferences && currentUser.preferences.length > 0 && (
                    <div className="pt-8 border-t">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Interests & Academic Preferences</h3>
                        <div className="flex flex-wrap gap-2">
                            {currentUser.preferences.map(preference => (
                                <Badge key={preference} variant="secondary" className="px-4 py-1 font-bold">{preference}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                
                {currentUser.networkActivity && (
                    <div className="pt-8 border-t">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Platform Engagement</h3>
                        <p className="text-base text-muted-foreground italic leading-relaxed">"{currentUser.networkActivity}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
