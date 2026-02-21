'use client';

import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthenticationPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-image-1');

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo className="h-12" />
            <h1 className="text-3xl font-bold font-headline mt-4">Welcome to Nexus Alumni</h1>
            <p className="text-balance text-muted-foreground">
              Connect, grow, and succeed with your alumni network.
            </p>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Log In</CardTitle>
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
                        <CardTitle>Sign Up</CardTitle>
                        <CardDescription>Create an account to join the network.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SignupForm />
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
          <div className="mt-4">
            <Link href="/" passHref>
              <Button variant="outline" className="w-full">View Public Homepage</Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            width="1200"
            height="800"
            data-ai-hint={heroImage.imageHint}
            className="h-full w-full object-cover dark:brightness-[0.4]"
          />
        )}
      </div>
    </div>
  );
}
