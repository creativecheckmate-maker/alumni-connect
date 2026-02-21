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
import { Mail, Briefcase, GraduationCap, BrainCircuit, School, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { CldUploadWidget } from 'next-cloudinary';
import { useToast } from '@/hooks/use-toast';

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

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const handleUploadSuccess = (result: any) => {
    if (result.event === 'success' && result.info?.secure_url) {
      if (!userDocRef) return;
      
      const newAvatarUrl = result.info.secure_url;
  
      updateDocumentNonBlocking(userDocRef, { avatarUrl: newAvatarUrl });
  
      toast({
        title: "Profile Picture Updated",
        description: "Your new picture has been saved.",
      });
    }
  };

  if (isUserLoading || !currentUser) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
        <PageHeader title="Your Profile">
             <Dialog>
                <DialogTrigger asChild>
                    <Button><Edit className="mr-2 h-4 w-4"/>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <EditProfileForm currentUser={currentUser} />
                </DialogContent>
            </Dialog>
        </PageHeader>
        
        <Card className="overflow-hidden">
            <CardHeader className="relative flex flex-col items-center justify-center space-y-4 bg-card p-6 text-center">
                <div className="absolute top-0 left-0 w-full h-24 bg-primary/10 -z-1"></div>
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!}
                  onSuccess={handleUploadSuccess}
                >
                  {({ open }) => (
                    <div className="relative group cursor-pointer" onClick={() => open()}>
                      <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background bg-background shadow-md">
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                        <AvatarFallback className="text-4xl">{getInitials(currentUser.name)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center rounded-full transition-all duration-200">
                          <Edit className="h-8 w-8 text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                  )}
                </CldUploadWidget>
                <div className="space-y-1">
                <CardTitle className="text-3xl font-bold font-headline">{currentUser.name}</CardTitle>
                <CardDescription>{currentUser.college} at {currentUser.university}</CardDescription>
                <Badge variant={currentUser.role === 'student' ? 'secondary' : 'outline'} className="capitalize !mt-2 text-sm">{currentUser.role}</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <h3 className="font-semibold text-muted-foreground">Email</h3>
                            <a href={`mailto:${currentUser.email}`} className="text-primary hover:underline">{currentUser.email}</a>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <School className="h-5 w-5 text-muted-foreground mt-1" />
                        <div>
                            <h3 className="font-semibold text-muted-foreground">Education</h3>
                            <p>{currentUser.university}</p>
                            <p className="text-muted-foreground">{currentUser.college}</p>
                        </div>
                    </div>

                    {currentUser.role === 'student' ? (
                    <>
                        <div className="flex items-start gap-3">
                            <GraduationCap className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <h3 className="font-semibold text-muted-foreground">Major</h3>
                                <p>{(currentUser as Student).major}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <GraduationCap className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <h3 className="font-semibold text-muted-foreground">Class of</h3>
                                <p>{(currentUser as Student).graduationYear}</p>
                            </div>
                        </div>
                    </>
                    ) : (
                    <>
                        <div className="flex items-start gap-3">
                            <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <h3 className="font-semibold text-muted-foreground">Department</h3>
                                <p>{(currentUser as Professor).department}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <BrainCircuit className="h-5 w-5 text-muted-foreground mt-1" />
                            <div>
                                <h3 className="font-semibold text-muted-foreground">Research Interests</h3>
                                <p>{(currentUser as Professor).researchInterests?.join(', ')}</p>
                            </div>
                        </div>
                    </>
                    )}
                </div>
    
                {currentUser.preferences && currentUser.preferences.length > 0 && (
                        <div>
                        <h3 className="font-semibold text-base mb-2">Interests & Preferences</h3>
                        <div className="flex flex-wrap gap-2">
                            {currentUser.preferences.map(preference => (
                                <Badge key={preference} variant="secondary">{preference}</Badge>
                            ))}
                        </div>
                    </div>
                )}
                    {currentUser.networkActivity && (
                        <div>
                        <h3 className="font-semibold text-base mb-2">Recent Activity</h3>
                        <p className="text-sm text-muted-foreground italic">"{currentUser.networkActivity}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </>
  );
}
