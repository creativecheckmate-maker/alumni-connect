
'use client';

import type { User, Student, Professor, Friendship } from '@/lib/definitions';
import { notFound, useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, GraduationCap, Mail, BrainCircuit, School, Edit, Star, Loader2, UserPlus, UserCheck, XCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useDoc, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useFirebase, useCollection, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { ADMIN_EMAIL } from '@/lib/config';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { EditProfileForm } from '@/components/profile/edit-profile-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const router = useRouter();

  const { user: authUser, isUserLoading: isAuthLoading, isEditMode } = useFirebase();
  const firestore = useFirestore();

  const viewerDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: viewerProfile } = useDoc<User>(viewerDocRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);
  
  const { data: user, isLoading: isDocLoading, error } = useDoc<User>(userDocRef);

  // Friendship state logic
  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid || !userId) return null;
    return query(collection(firestore, 'friendships'), where('uids', 'array-contains', authUser.uid));
  }, [firestore, authUser?.uid, userId]);

  const { data: friendships } = useCollection<Friendship>(friendshipQuery);
  const friendship = friendships?.find(f => f.uids.includes(userId));
  const isMutual = friendship?.status === 'mutual';
  const isRequestedByMe = friendship && friendship.followedBy.includes(authUser?.uid || '') && !isMutual;
  const hasRequestedMe = friendship && !friendship.followedBy.includes(authUser?.uid || '') && !isMutual;

  const [ratingValue, setRatingValue] = useState(80);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const isAdmin = authUser?.email === ADMIN_EMAIL;
  const isOwnProfile = authUser?.uid === userId;
  const isStudentViewer = viewerProfile?.role === 'student';
  const isProfessorOrStaffTarget = user?.role === 'professor' || user?.role === 'non-teaching-staff';

  const handleFeedbackSubmit = () => {
    if (!userDocRef || !user) return;
    setIsSubmittingFeedback(true);

    const currentPoints = user.totalFeedbackPoints || user.feedbackRating || 0;
    const currentCount = user.feedbackCount || 1;

    const newTotalPoints = currentPoints + ratingValue;
    const newCount = currentCount + 1;
    const newAverage = Math.round(newTotalPoints / newCount);

    updateDocumentNonBlocking(userDocRef, {
      feedbackRating: newAverage,
      feedbackCount: newCount,
      totalFeedbackPoints: newTotalPoints,
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Feedback Submitted!",
      description: `Thank you for rating ${user.name}.`,
    });

    setIsSubmittingFeedback(false);
    setIsFeedbackDialogOpen(false);
  };

  const handleCancelRequest = async () => {
    if (!firestore || !authUser || !friendship) return;
    deleteDocumentNonBlocking(doc(firestore, 'friendships', friendship.id));
    toast({ title: "Request Cancelled", description: "Your connection request has been withdrawn." });
  };

  const handleFollowUser = async () => {
    if (!firestore || !authUser) {
      router.push('/login');
      return;
    }
    const friendshipId = [authUser.uid, userId].sort().join('_');

    if (friendship) {
      if (friendship.followedBy.includes(authUser.uid)) return;
      
      const newFollowedBy = [...friendship.followedBy, authUser.uid];
      const isMutual = newFollowedBy.length === 2;
      
      updateDocumentNonBlocking(doc(firestore, 'friendships', friendship.id), {
        followedBy: newFollowedBy,
        status: isMutual ? 'mutual' : 'pending',
        updatedAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: userId,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} accepted your request and followed you back!`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: isMutual ? "Connected!" : "Followed Back", description: `You are now connected with ${user?.name}.` });
    } else {
      const data = {
        id: friendshipId,
        uids: [authUser.uid, userId],
        followedBy: [authUser.uid],
        status: 'pending',
        updatedAt: serverTimestamp()
      };
      setDocumentNonBlocking(doc(firestore, 'friendships', friendshipId), data, { merge: true });
      
      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: userId,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} sent you a connection request.`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Request Sent", description: `Connection request sent to ${user?.name}.` });
    }
  };

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

  if (error) throw error;
  if (!user && !isDocLoading) notFound();
  if (!user) return null;

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
                    <div className="flex gap-2">
                        {isAdmin && !isOwnProfile && isEditMode && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><Edit className="mr-2 h-4 w-4"/>Edit Profile</Button>
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
                        {!isOwnProfile && authUser && (
                          <div className="flex gap-2">
                            {isMutual ? (
                              <Button variant="outline" className="gap-2" disabled>
                                <UserCheck className="h-4 w-4" /> Connected
                              </Button>
                            ) : isRequestedByMe ? (
                              <Button variant="destructive" className="gap-2" onClick={handleCancelRequest}>
                                <XCircle className="h-4 w-4" /> Cancel Request
                              </Button>
                            ) : (
                              <Button className="gap-2" onClick={handleFollowUser}>
                                {hasRequestedMe ? <><UserCheck className="h-4 w-4" /> Accept & Follow Back</> : <><UserPlus className="h-4 w-4" /> Connect</>}
                              </Button>
                            )}
                          </div>
                        )}
                        {authUser && isStudentViewer && isProfessorOrStaffTarget && !isOwnProfile && (
                            <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary hover:bg-primary/90"><Star className="mr-2 h-4 w-4" /> Give Feedback</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>Rate {user.name}</DialogTitle>
                                        <DialogDescription>
                                            Share your feedback as a student. This will help fellow alumni know about {user.name}'s contributions.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-12 space-y-8">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-sm font-medium">Poor</span>
                                            <span className="text-2xl font-bold text-primary">{ratingValue}/100</span>
                                            <span className="text-sm font-medium">Excellent</span>
                                        </div>
                                        <Slider
                                            defaultValue={[ratingValue]}
                                            max={100}
                                            step={1}
                                            onValueChange={(vals) => setRatingValue(vals[0])}
                                            className="w-full"
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button 
                                            onClick={handleFeedbackSubmit} 
                                            className="w-full"
                                            disabled={isSubmittingFeedback}
                                        >
                                            {isSubmittingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Submit Rating
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
              <Card className="overflow-hidden shadow-lg border-none">
                <CardHeader className="relative flex flex-col items-center justify-center space-y-4 bg-card p-10 text-center">
                    <div className="absolute top-0 left-0 w-full h-32 bg-primary/10 -z-1"></div>
                  <Avatar className="h-32 w-32 md:h-40 md:w-40 border-8 border-background bg-background shadow-xl">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback className="text-5xl bg-muted">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <CardTitle className="text-4xl font-bold font-headline">{user.name}</CardTitle>
                        {isProfessorOrStaffTarget && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" /> {user.feedbackRating || 0}
                            </Badge>
                        )}
                    </div>
                    <CardDescription className="text-lg">{user.college} — {user.university}</CardDescription>
                    <Badge variant={user.role === 'student' ? 'secondary' : 'outline'} className="capitalize mt-2 px-4 py-1 text-sm font-semibold">{user.role}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-10 grid gap-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-base">
                        <div className="flex items-start gap-4">
                           <div className="p-2 rounded-lg bg-primary/10 text-primary">
                             <Mail className="h-6 w-6" />
                           </div>
                           <div>
                                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Email Contact</h3>
                                <a href={`mailto:${user.email}`} className="text-primary hover:underline font-medium text-lg">{user.email}</a>
                           </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="p-2 rounded-lg bg-primary/10 text-primary">
                             <School className="h-6 w-6" />
                           </div>
                           <div>
                                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Institution</h3>
                                <p className="font-medium text-lg">{user.university}</p>
                                <p className="text-muted-foreground">{user.college}</p>
                           </div>
                        </div>

                        {user.role === 'student' ? (
                        <>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <GraduationCap className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Major Field of Study</h3>
                                    <p className="font-medium text-lg">{(user as Student).major}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <GraduationCap className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Graduation</h3>
                                    <p className="font-medium text-lg">Class of {(user as Student).graduationYear}</p>
                                </div>
                            </div>
                        </>
                        ) : (
                        <>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <Briefcase className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Department</h3>
                                    <p className="font-medium text-lg">{(user as Professor).department}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                  <BrainCircuit className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Research Specialization</h3>
                                    <p className="font-medium text-lg">{(user as Professor).researchInterests?.join(', ')}</p>
                                </div>
                            </div>
                        </>
                        )}
                    </div>
        
                    {user.preferences && user.preferences.length > 0 && (
                         <div className="pt-6 border-t">
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Interests & Academic Preferences</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.preferences.map(preference => (
                                    <Badge key={preference} variant="secondary" className="px-3 py-1">{preference}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                     {user.networkActivity && (
                         <div className="pt-6 border-t">
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Community Engagement</h3>
                            <p className="text-lg leading-relaxed text-muted-foreground italic">"{user.networkActivity}"</p>
                        </div>
                    )}
                </CardContent>
              </Card>
            </div>
        </main>
    </div>
  );
}
