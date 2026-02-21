'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDoc, useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import type { User, Student, Professor } from '@/lib/definitions';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser, isLoading: isUserLoading } = useDoc<User>(userDocRef);
  
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<Partial<User>>();

  useEffect(() => {
    if (currentUser) {
      const preferencesString = Array.isArray(currentUser.preferences) ? currentUser.preferences.join(', ') : '';
      const researchInterestsString = Array.isArray((currentUser as Professor).researchInterests) ? (currentUser as Professor).researchInterests.join(', ') : '';
      
      reset({
        ...currentUser,
        preferences: preferencesString as any,
        researchInterests: researchInterestsString as any,
      });
    }
  }, [currentUser, reset]);

  const onSubmit = async (data: Partial<User>) => {
    if (!userDocRef) return;
    
    const updatedData = {
      ...data,
      preferences: (data.preferences as any)?.split(',').map((p: string) => p.trim()) || [],
      researchInterests: (data.researchInterests as any)?.split(',').map((p: string) => p.trim()) || [],
      updatedAt: serverTimestamp(),
    };
    
    delete updatedData.id;
    delete updatedData.role;
    delete updatedData.email;

    updateDocumentNonBlocking(userDocRef, updatedData);

    toast({
      title: "Profile Updated",
      description: "Your changes have been saved.",
    });
  };

  if (isUserLoading || !currentUser) {
    return (
      <>
        <PageHeader title="Manage Profile" />
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/3" />
             <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Manage Profile" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your photo and personal details here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={currentUser.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input id="university" {...register('university')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college">College</Label>
              <Input id="college" {...register('college')} />
            </div>

            {currentUser.role === 'student' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input id="major" {...register('major')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input id="graduationYear" type="number" {...register('graduationYear')} />
                </div>
              </>
            )}

            {currentUser.role === 'professor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" {...register('department')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="researchInterests">Research Interests</Label>
                  <Input id="researchInterests" {...register('researchInterests' as any)} />
                </div>
              </>
            )}

              <div className="space-y-2">
                  <Label htmlFor="preferences">Preferences</Label>
                  <Input id="preferences" placeholder="e.g. networking, software engineering" {...register('preferences' as any)} />
                  <p className="text-sm text-muted-foreground">Separate preferences with commas. Used for AI recommendations.</p>
              </div>

            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </form>
    </>
  );
}
