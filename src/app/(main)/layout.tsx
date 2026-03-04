'use client';

import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Settings2, Edit, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirebase, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { ADMIN_EMAIL } from '@/lib/config';
import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp, query, collection, where, onSnapshot } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { SiteContent } from '@/lib/definitions';

function HeaderEditDialog({ initialData }: { initialData: any }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', 'global_header'), {
        id: 'global_header',
        pageId: 'global',
        sectionId: 'header',
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Header Updated", description: "Global header settings saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Header Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {Object.keys(initialData).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              <Input 
                value={data[key]} 
                onChange={(e) => setData({ ...data, [key]: e.target.value })} 
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Header
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isEditMode, setIsEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = user?.email === ADMIN_EMAIL;

  const headerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_header'), [firestore]);
  const { data: headerContent } = useDoc<SiteContent>(headerDocRef);

  const defaultHeader = {
    logoPart1: "Alumni",
    logoPart2: "Connect",
    searchPlaceholder: "Search anything...",
    loginButton: "Log In",
    signupButton: "Join Today"
  };

  const currentHeader = headerContent?.data || defaultHeader;

  // Background message delivery listener
  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const q = query(
      collection(firestore, 'messages'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'sent')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((d) => {
        updateDocumentNonBlocking(d.ref, { status: 'delivered' });
      });
    });

    return () => unsubscribe();
  }, [firestore, user?.uid]);

  // Real-time Presence Sync
  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const userRef = doc(firestore, 'users', user.uid);

    const setPresence = (isOnline: boolean) => {
      updateDocumentNonBlocking(userRef, {
        isOnline,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    };

    // Initial online status when app mounts
    setPresence(true);

    const handleVisibilityChange = () => {
      // Offline when user hides tab or app
      setPresence(document.visibilityState === 'visible');
    };

    const handleBeforeUnload = () => {
      setPresence(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup on logout or component destruction
    return () => {
      setPresence(false);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [firestore, user?.uid]);

  return (
    <SidebarProvider>
      <MainNav logoPart1={currentHeader.logoPart1} logoPart2={currentHeader.logoPart2} />
      <SidebarInset>
        <header className="flex sticky top-0 z-30 h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex-1">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={currentHeader.searchPlaceholder}
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          
          {isAdmin && (
            <div className="flex items-center gap-2 mr-4 bg-muted/50 px-3 py-1.5 rounded-full border border-primary/20 animate-in fade-in slide-in-from-right-2">
              {isEditMode && <HeaderEditDialog initialData={currentHeader} />}
              <Settings2 className="h-4 w-4 text-primary" />
              <Label htmlFor="edit-mode" className="text-xs font-bold whitespace-nowrap">Edit Mode</Label>
              <Switch 
                id="edit-mode" 
                checked={isEditMode} 
                onCheckedChange={setIsEditMode} 
              />
            </div>
          )}

          {user ? (
            <UserNav />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">{currentHeader.loginButton}</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">{currentHeader.signupButton}</Button>
              </Link>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
