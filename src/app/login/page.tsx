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

export default function AuthenticationPage() {
  const [activeTab, setActiveTab] = useState('login');

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
                onClick={() => setActiveTab(activeTab === 'login' ? 'signup' : 'login')}
              >
                {activeTab === 'login' ? 'Sign Up' : 'Log In'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
                        <CardDescription>Enter your credentials to access your account.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LoginForm />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-serif text-2xl">Create an Account</CardTitle>
                        <CardDescription>Join the network to connect with alumni.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SignupForm onSignupSuccess={() => setActiveTab('login')} />
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
