'use client';

import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Search, Settings2, Edit, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFirebase, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import Image from 'next/image';
import { ADMIN_EMAIL } from '@/lib/config';
import { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { SiteContent } from '@/lib/definitions';
import { CldUploadWidget } from 'next-cloudinary';

function AdminEditDialog({ pageId, sectionId, initialData, label }: { pageId: string, sectionId: string, initialData: any, label: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', `${pageId}_${sectionId}`), {
        id: `${pageId}_${sectionId}`,
        pageId,
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: `${label} saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full shadow-lg">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => (
            <div key={key} className="space-y-2">
              <label className="capitalize text-sm font-bold text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</label>
              <div className="flex flex-col gap-2">
                {key.toLowerCase().includes('url') && data[key] && (
                  <div className="relative h-24 w-full rounded-xl overflow-hidden border bg-muted">
                    <Image src={data[key]} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input 
                    value={data[key] || ""} 
                    onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                  />
                  {key.toLowerCase().includes('url') && (
                    <CldUploadWidget 
                      uploadPreset="ml_default"
                      options={{ 
                        cloudName: "dnex9nw0f",
                        cropping: true,
                        showSkipCropButton: true,
                        singleUploadAutoClose: true,
                        multiple: false,
                        sources: ['local', 'url', 'camera']
                      }}
                      onSuccess={(res: any) => {
                        const url = res?.info?.secure_url || res?.info?.url;
                        if (url) {
                          setData((prev: any) => ({ ...prev, [key]: url }));
                        }
                      }}
                    >
                      {({ open }) => (
                        <Button variant="outline" size="icon" onClick={() => open()}>
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
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

  const footerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_footer'), [firestore]);
  const { data: footerContent } = useDoc<SiteContent>(footerDocRef);

  const defaultHeader = {
    logoPart1: "Alumni",
    logoPart2: "Connect",
    searchPlaceholder: "Search anything...",
    loginButton: "Log In",
    signupButton: "Join Today"
  };

  const defaultFooter = {
    copyright: "© 2024 Nexus University Alumni Network",
    tagline: "Empowering our global community.",
    link1: "Privacy Policy",
    link2: "Terms of Service"
  };

  const header = headerContent?.data || defaultHeader;
  const footer = footerContent?.data || defaultFooter;

  useEffect(() => {
    if (!firestore || !user?.uid) return;
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, { isOnline: true, lastSeen: serverTimestamp() });
    return () => {
      updateDocumentNonBlocking(userRef, { isOnline: false, lastSeen: serverTimestamp() });
    };
  }, [firestore, user?.uid]);

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
              {isEditMode && <AdminEditDialog pageId="global" sectionId="header" initialData={header} label="Header Settings" />}
              <Settings2 className="h-4 w-4 text-primary" />
              <label htmlFor="edit-mode" className="text-xs font-bold whitespace-nowrap cursor-pointer">Edit Mode</label>
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
                <Button variant="ghost" size="sm">{header.loginButton}</Button>
              </Link>
              <Link href="/login">
                <Button size="sm">{header.signupButton}</Button>
              </Link>
            </div>
          )}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
          
          <footer className="mt-auto pt-10 pb-6 border-t relative">
            {isAdmin && isEditMode && (
              <div className="absolute top-0 right-0 p-2">
                <AdminEditDialog pageId="global" sectionId="footer" initialData={footer} label="Footer Settings" />
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
