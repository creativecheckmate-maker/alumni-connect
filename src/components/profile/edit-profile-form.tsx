'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import type { User, Student, Professor } from '@/lib/definitions';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function EditProfileForm({ currentUser }: { currentUser: User }) {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);
  
  const form = useForm<Partial<User>>({
    defaultValues: currentUser,
  });

  useEffect(() => {
    if (currentUser) {
      const preferencesString = Array.isArray(currentUser.preferences) ? currentUser.preferences.join(', ') : '';
      const researchInterestsString = Array.isArray((currentUser as Professor).researchInterests) ? (currentUser as Professor).researchInterests.join(', ') : '';
      
      form.reset({
        ...currentUser,
        preferences: preferencesString as any,
        researchInterests: researchInterestsString as any,
      });
    }
  }, [currentUser, form.reset]);

  const onSubmit = async (data: Partial<User>) => {
    if (!userDocRef) return;
    
    const updatedData: any = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    
    if (typeof data.preferences === 'string') {
      updatedData.preferences = data.preferences.split(',').map((p: string) => p.trim()).filter(Boolean);
    }

    if (currentUser.role === 'professor' && typeof data.researchInterests === 'string') {
        updatedData.researchInterests = data.researchInterests.split(',').map((p: string) => p.trim()).filter(Boolean);
    }
    
    // Prevent sensitive fields from being updated
    delete updatedData.id;
    delete updatedData.role;
    delete updatedData.email;

    updateDocumentNonBlocking(userDocRef, updatedData);

    toast({
      title: "Profile Updated",
      description: "Your changes have been saved.",
    });
  };

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormItem>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={currentUser.email} disabled />
        </FormItem>
        <FormField
            control={form.control}
            name="university"
            render={({ field }) => (
                <FormItem>
                <FormLabel>University</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="college"
            render={({ field }) => (
                <FormItem>
                <FormLabel>College</FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        {currentUser.role === 'student' && (
            <>
            <FormField
                control={form.control}
                name="major"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Major</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="graduationYear"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Graduation Year</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            </>
        )}

        {currentUser.role === 'professor' && (
            <>
            <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="researchInterests"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Research Interests</FormLabel>
                    <FormControl>
                        <Input {...field as any} />
                    </FormControl>
                    <FormDescription>Separate interests with commas.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            </>
        )}

        <FormField
            control={form.control}
            name="preferences"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Preferences</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. networking, software engineering" {...field as any} />
                </FormControl>
                <FormDescription>Separate preferences with commas. Used for AI recommendations.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </div>
    </form>
    </Form>
  );
}
