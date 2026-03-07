'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirestore, useMemoFirebase, updateDocumentNonBlocking, useDoc, useFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import type { User, Student, Professor, SiteContent } from '@/lib/definitions';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, UserCircle, AlertCircle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { moderateContent } from '@/ai/flows/moderation';
import { ADMIN_EMAIL } from '@/lib/config';

export function EditProfileForm({ currentUser }: { currentUser: User }) {
  const firestore = useFirestore();
  const { user: authUser } = useFirebase();
  const { toast } = useToast();
  const [isModerating, setIsModerating] = useState(false);
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const configDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_config'), [firestore]);
  const { data: globalConfig } = useDoc<SiteContent>(configDocRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.id) return null;
    return doc(firestore, 'users', currentUser.id);
  }, [firestore, currentUser?.id]);
  
  const form = useForm<Partial<User>>({
    defaultValues: currentUser,
  });

  const selectedRole = form.watch('role');

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
    
    setIsModerating(true);
    let isSafe = true;
    let moderationReason = "";

    try {
      const textToModerate = `${data.name || ''} ${data.university || ''} ${data.college || ''} ${data.preferences || ''} ${(data as any).researchInterests || ''}`;
      const moderation = await moderateContent({ text: textToModerate });
      isSafe = moderation.isSafe;
      moderationReason = moderation.reason || "Content policy violation.";
    } catch (e) {
      console.warn("Moderation service unavailable, falling back to manual standards.", e);
      isSafe = true;
    }

    if (!isSafe) {
      toast({
        variant: 'destructive',
        title: "Content Policy Violation",
        description: moderationReason,
      });
      setIsModerating(false);
      return;
    }

    try {
      const rawData = { ...data };
      delete rawData.id;
      delete rawData.email;
      delete rawData.createdAt;

      const sanitizedData: any = {};
      Object.entries(rawData).forEach(([key, value]) => {
        if (value !== undefined) {
          sanitizedData[key] = value;
        }
      });
      
      if (typeof sanitizedData.preferences === 'string') {
        sanitizedData.preferences = sanitizedData.preferences.split(',').map((p: string) => p.trim()).filter(Boolean);
      }

      if (selectedRole === 'professor' && typeof sanitizedData.researchInterests === 'string') {
          sanitizedData.researchInterests = sanitizedData.researchInterests.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
      
      sanitizedData.updatedAt = serverTimestamp();
      updateDocumentNonBlocking(userDocRef, sanitizedData);

      toast({
        title: "Profile Updated",
        description: "Your professional details and category have been updated successfully.",
      });

      form.reset(data);
    } catch (e) {
      console.error("Profile update error:", e);
      toast({ 
        variant: 'destructive', 
        title: "Update Error", 
        description: "An error occurred while preparing your profile update." 
      });
    } finally {
      setIsModerating(false);
    }
  };

  const hideProfessors = !isAdmin && globalConfig?.data?.hideProfessors === true;
  const hideStaff = !isAdmin && globalConfig?.data?.hideStaff === true;

  return (
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[75vh] overflow-y-auto p-1 pr-3">
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl mb-2 border border-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Professional Standards: Category changes are subject to verification</p>
        </div>

        <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <UserCircle className="h-4 w-4" /> Professional Category
                    </FormLabel>
                    <FormControl>
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                        >
                            <FormItem className="flex items-center space-x-2 space-y-0 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                                <FormControl>
                                    <RadioGroupItem value="student" />
                                </FormControl>
                                <FormLabel className="font-bold text-xs cursor-pointer">Student/Alumni</FormLabel>
                            </FormItem>
                            
                            {(isAdmin || !hideProfessors) && (
                              <FormItem className="flex items-center space-x-2 space-y-0 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                                  <FormControl>
                                      <RadioGroupItem value="professor" />
                                  </FormControl>
                                  <FormLabel className="font-bold text-xs cursor-pointer">Professor</FormLabel>
                              </FormItem>
                            )}
                            
                            {(isAdmin || !hideStaff) && (
                              <FormItem className="flex items-center space-x-2 space-y-0 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                                  <FormControl>
                                      <RadioGroupItem value="non-teaching-staff" />
                                  </FormControl>
                                  <FormLabel className="font-bold text-xs cursor-pointer">Staff</FormLabel>
                              </FormItem>
                            )}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Input type="email" value={currentUser.email} disabled className="bg-muted/50" />
            </FormItem>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {selectedRole === 'student' && (
            <div className="bg-primary/5 p-4 rounded-2xl space-y-4 border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="major"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Major</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="e.g. Computer Science" />
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
                                <Input type="number" {...field} placeholder="2024" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        )}

        {(selectedRole === 'professor' || selectedRole === 'non-teaching-staff') && (
            <div className="bg-primary/5 p-4 rounded-2xl space-y-4 border border-primary/10 animate-in fade-in slide-in-from-top-2">
                <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. Electrical Engineering" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                {selectedRole === 'professor' && (
                    <FormField
                        control={form.control}
                        name="researchInterests"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Research Interests</FormLabel>
                            <FormControl>
                                <Input {...field as any} placeholder="AI, Machine Learning, Signal Processing" />
                            </FormControl>
                            <FormDescription className="text-[10px]">Separate interests with commas.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        )}

        <FormField
            control={form.control}
            name="preferences"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Professional Interests (for AI Recommendations)</FormLabel>
                <FormControl>
                    <Input placeholder="e.g. networking, software engineering, startups" {...field as any} />
                </FormControl>
                <FormDescription className="text-[10px]">Separate preferences with commas. Nexus AI uses this to personalize your feed.</FormDescription>
                <FormMessage />
                </FormItem>
            )}
        />

        <div className="flex justify-end pt-4 gap-2">
            <Button type="submit" className="h-12 px-8 font-black rounded-xl shadow-lg" disabled={isModerating || !form.formState.isDirty}>
                {isModerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isModerating ? "Verifying..." : "Apply Category & Changes"}
            </Button>
        </div>
    </form>
    </Form>
  );
}
