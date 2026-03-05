'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { SiteContent } from '@/lib/definitions';
import { ShieldAlert, Lock, Zap, Loader2 } from 'lucide-react';

export default function AuthenticationPage() {
  const [activeTab, setActiveTab] = useState('login');
  const firestore = useFirestore();

  const configDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_config'), [firestore]);
  const { data: globalConfig, isLoading: isConfigLoading } = useDoc<SiteContent>(configDocRef);

  const isPlatformLocked = globalConfig?.data?.isBlocked === true;

  if (isConfigLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
       <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="container mx-auto">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {activeTab === 'login' ? "Don't have an account?" : "Already have an account?"}
              </span>
              <Button
                variant="outline"
                disabled={isPlatformLocked && activeTab === 'login'}
                onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
              >
                {activeTab === 'login' ? 'Sign Up' : 'Log In'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-[400px] gap-6">
          {isPlatformLocked && (
            <div className="bg-zinc-900 p-6 rounded-3xl border border-primary/20 mb-2 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-xs font-black uppercase text-white tracking-widest">Global Lock Active</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                The platform is currently in maintenance mode. Login is restricted to <strong>System Administrators</strong> only. Signup is disabled.
              </p>
            </div>
          )}

          <Tabs value={isPlatformLocked ? 'login' : activeTab} onValueChange={setActiveTab} className="w-full">
            {!isPlatformLocked && (
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            )}
            
            <TabsContent value="login">
                <Card className="border-none shadow-2xl">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl font-black italic uppercase tracking-tighter">
                          {isPlatformLocked ? 'Admin Override' : 'Welcome Back'}
                        </CardTitle>
                        <CardDescription>
                          {isPlatformLocked 
                            ? 'Enter administrative credentials to unlock the sector.' 
                            : 'Enter your credentials to access your account.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
            </TabsContent>

            {!isPlatformLocked && (
              <TabsContent value="signup">
                  <Card className="border-none shadow-2xl">
                      <CardHeader>
                          <CardTitle className="font-headline text-2xl font-black italic uppercase tracking-tighter">Create Account</CardTitle>
                          <CardDescription>Join the network to connect with alumni.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <SignupForm onSignupSuccess={() => setActiveTab('login')} />
                      </CardContent>
                  </Card>
              </TabsContent>
            )}
          </Tabs>

          {isPlatformLocked && (
            <div className="flex items-center justify-center gap-2 opacity-50 mt-4">
              <ShieldAlert className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">Authorized Access Only</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
