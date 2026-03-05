'use client';

import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signup } from '@/lib/actions';
import { Loader2, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { signupSchema } from '@/lib/schemas';


export function SignupForm({ onSignupSuccess }: { onSignupSuccess: () => void }) {
  const [state, dispatch] = useActionState(signup, undefined);
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const currentYear = new Date().getFullYear();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      university: '',
      college: '',
      role: 'student',
      major: '',
      graduationYear: '' as any,
      department: '',
      researchInterests: '',
    },
  });

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Account Created!",
        description: state.message,
      });
      onSignupSuccess();
    } else if (state?.message) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: state.message,
      });
    }
  }, [state, toast, onSignupSuccess]);

  const role = form.watch('role');
  const gradYear = form.watch('graduationYear');

  return (
    <Form {...form}>
      <form
        action={dispatch}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <FormControl>
                <Input placeholder="Nexus University" {...field} />
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
                <Input placeholder="College of Engineering" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I am a...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex flex-wrap gap-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="student" />
                    </FormControl>
                    <FormLabel className="font-normal text-xs uppercase font-bold">Student / Alumnus</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="professor" />
                    </FormControl>
                    <FormLabel className="font-normal text-xs uppercase font-bold">Professor</FormLabel>
                  </FormItem>
                   <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="non-teaching-staff" />
                    </FormControl>
                    <FormLabel className="font-normal text-xs uppercase font-bold">Staff</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <input type="hidden" name={field.name} value={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />

        {role === 'student' && (
          <div className="bg-primary/5 p-4 rounded-2xl space-y-4 border border-primary/10">
            <FormField
              control={form.control}
              name="major"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Major</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Computer Science" {...field} />
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Graduation Year</FormLabel>
                    {gradYear && Number(gradYear) < currentYear && (
                      <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                        <GraduationCap className="h-3 w-3" /> Alumni Status
                      </div>
                    )}
                  </div>
                  <FormControl>
                    <Input type="number" placeholder={currentYear.toString()} {...field} />
                  </FormControl>
                  <FormDescription className="text-[10px] leading-tight">
                    Years before {currentYear} will mark your profile as **Alumnus (Legacy)**.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {(role === 'professor' || role === 'non-teaching-staff') && (
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Electrical Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {role === 'professor' && (
          <FormField
            control={form.control}
            name="researchInterests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Research Interests (comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Signal Processing, AI" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <SubmitButton />
      </form>
    </Form>
  );
}

function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <Button type="submit" className="w-full h-12 font-bold rounded-xl shadow-lg" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    );
  }
