'use client';

import type { User, Student, Professor } from '@/lib/definitions';
import { notFound, useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, GraduationCap, Mail, BrainCircuit, School, Edit } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ADMIN_EMAIL } from '@/lib/config';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { Skeleton } from '@/components/ui/skeleton';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0]?.substring(0, 2) || '';
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (isAuthLoading || !firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId, isAuthLoading]);
  
  const { data: user, isLoading: isDocLoading } = useDoc<User>(userDocRef);

  const isAdmin = authUser?.email === ADMIN_EMAIL;
  const isOwnProfile = authUser?.uid === userId;

  const isLoading = isAuthLoading || isDocLoading;

  if (isLoading) {
      return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-8" />
                </Link>
            </header>
            <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
                 <Skeleton className="h-10 w-48 mb-4" />
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
            </main>
        </div>
      )
  }

  if (!user) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between z-10">
            <Link href="/" className="flex items-center gap-2">
                <Logo className="h-8" />
            </Link>
             <div className="flex gap-2">
                {!authUser && (
                    <>
                        <Link href="/login">
                            <Button variant="outline">Log In</Button>
                        </Link>
                        <Link href="/login">
                            <Button>Sign Up</Button>
                        </Link>
                    </>
                )}
                 {authUser && isOwnProfile && (
                     <Link href="/profile">
                        <Button>My Profile</Button>
                    </Link>
                 )}
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-4 flex justify-between items-center">
                    <Link href={authUser ? "/directory" : "/"}>
                        <Button variant="ghost" className="text-muted-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to {authUser ? "Directory" : "Homepage"}</Button>
                    </Link>
                    {isAdmin && !isOwnProfile && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button><Edit className="mr-2 h-4 w-4"/>Edit Profile</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                    <DialogTitle>Edit Profile</DialogTitle>
                                    <DialogDescription>
                                        Make changes to {user.name}'s profile. Click save when you're done.
                                    </DialogDescription>
                                </DialogHeader>
                                <EditProfileForm currentUser={user} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
              <Card className="overflow-hidden">
                <CardHeader className="relative flex flex-col items-center justify-center space-y-4 bg-card p-6 text-center">
                    <div className="absolute top-0 left-0 w-full h-24 bg-primary/10 -z-1"></div>
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background bg-background shadow-md">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-4xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-bold font-headline">{user.name}</CardTitle>
                    <CardDescription>{user.college} at {user.university}</CardDescription>
                    <Badge variant={user.role === 'student' ? 'secondary' : 'outline'} className="capitalize !mt-2 text-sm">{user.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="flex items-start gap-3">
                           <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                           <div>
                                <h3 className="font-semibold text-muted-foreground">Email</h3>
                                <a href={`mailto:${user.email}`} className="text-primary hover:underline">{user.email}</a>
                           </div>
                        </div>

                        <div className="flex items-start gap-3">
                           <School className="h-5 w-5 text-muted-foreground mt-1" />
                           <div>
                                <h3 className="font-semibold text-muted-foreground">Education</h3>
                                <p>{user.university}</p>
                                <p className="text-muted-foreground">{user.college}</p>
                           </div>
                        </div>

                        {user.role === 'student' ? (
                        <>
                            <div className="flex items-start gap-3">
                                <GraduationCap className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h3 className="font-semibold text-muted-foreground">Major</h3>
                                    <p>{(user as Student).major}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <GraduationCap className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h3 className="font-semibold text-muted-foreground">Class of</h3>
                                    <p>{(user as Student).graduationYear}</p>
                                </div>
                            </div>
                        </>
                        ) : (
                        <>
                            <div className="flex items-start gap-3">
                                <Briefcase className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h3 className="font-semibold text-muted-foreground">Department</h3>
                                    <p>{(user as Professor).department}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                               <BrainCircuit className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <h3 className="font-semibold text-muted-foreground">Research Interests</h3>
                                    <p>{(user as Professor).researchInterests?.join(', ')}</p>
                                </div>
                            </div>
                        </>
                        )}
                    </div>
        
                    {user.preferences && user.preferences.length > 0 && (
                         <div>
                            <h3 className="font-semibold text-base mb-2">Interests & Preferences</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.preferences.map(preference => (
                                    <Badge key={preference} variant="secondary">{preference}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                     {user.networkActivity && (
                         <div>
                            <h3 className="font-semibold text-base mb-2">Recent Activity</h3>
                            <p className="text-sm text-muted-foreground italic">"{user.networkActivity}"</p>
                        </div>
                    )}
                </CardContent>
              </Card>
            </div>
        </main>
    </div>
  );
}
