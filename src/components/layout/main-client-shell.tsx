'use client';

import React, { useEffect } from 'react';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Settings2, Edit, Loader2, Upload, ShieldAlert, Lock, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirebase, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { ADMIN_EMAIL } from '@/lib/config';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface MainClientShellProps {
  children: React.ReactNode;
  header: any;
  footer: any;
  isPlatformLocked: boolean;
  adminEditDialog: React.ReactNode;
  footerEditDialog: React.ReactNode;
}

/**
 * Client Component Shell for the Main Layout.
 * Handles interactive elements, Firebase presence, and Sidebar state.
 */
export function MainClientShell({ 
  children, 
  header, 
  footer, 
  isPlatformLocked,
  adminEditDialog,
  footerEditDialog
}: MainClientShellProps) {
  const { user, isEditMode, setIsEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Track User Presence
  useEffect(() => {
    if (!firestore || !user?.uid) return;
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, { isOnline: true, lastSeen: serverTimestamp() });
    return () => {
      updateDocumentNonBlocking(userRef, { isOnline: false, lastSeen: serverTimestamp() });
    };
  }, [firestore, user?.uid]);

  // Handle Platform Lockout for non-admins
  if (isPlatformLocked && !isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 p-4 font-headline overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        <div className="max-w-md w-full space-y-8 relative z-10 text-center">
          <div className="inline-flex p-6 rounded-[2.5rem] bg-primary/5 border border-primary/20 shadow-2xl shadow-primary/10 animate-pulse">
            <Lock className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Access Denied</h1>
            <div className="flex items-center justify-center gap-2 text-primary font-black text-xs uppercase tracking-[0.3em]">
              <Zap className="h-3 w-3 fill-current" />
              <span>Sector Locked: Restricted</span>
            </div>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed font-medium">
            The Nexus Alumni platform is currently in a high-security private state. 
          </p>
          <div className="pt-6">
            <Link href="/login">
              <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-800 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px]">
                System Override (Admin Only)
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <MainNav logoPart1={header.logoPart1} logoPart2={header.logoPart2} />
      <SidebarInset>
        <header className="flex sticky top-0 z-30 h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex-1">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={header.searchPlaceholder}
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-2 mr-4 bg-muted/50 px-3 py-1.5 rounded-full border border-primary/20">
              {isEditMode && adminEditDialog}
              <Settings2 className="h-4 w-4 text-primary" />
              <label htmlFor="edit-mode" className="text-xs font-bold cursor-pointer">Edit Mode</label>
              <Switch 
                id="edit-mode" 
                checked={isEditMode} 
                onCheckedChange={setIsEditMode} 
              />
            </div>
          )}

          {user ? <UserNav /> : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">{header.loginButton}</Button></Link>
              <Link href="/login"><Button size="sm">{header.signupButton}</Button></Link>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
          <footer className="mt-auto pt-10 pb-6 border-t relative">
            {isAdmin && isEditMode && (
              <div className="absolute top-0 right-0 p-2">
                {footerEditDialog}
              </div>
            )}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <div className="space-y-1 text-center md:text-left">
                <p className="font-bold text-foreground">{footer.copyright}</p>
                <p>{footer.tagline}</p>
              </div>
              <div className="flex gap-6">
                <Link href="#" className="hover:text-primary transition-colors">{footer.link1}</Link>
                <Link href="#" className="hover:text-primary transition-colors">{footer.link2}</Link>
              </div>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
