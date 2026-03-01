'use client';

import React, { useState } from 'react';
import { useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAIL } from '@/lib/config';
import type { SiteContent } from '@/lib/definitions';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title: defaultTitle, description: defaultDescription, children }: PageHeaderProps) {
  const { user, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Derive a stable ID from the title for CMS lookups
  const pageId = defaultTitle.toLowerCase().replace(/\s+/g, '_');
  const headerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', `header_${pageId}`), [firestore, pageId]);
  const { data: headerContent } = useDoc<SiteContent>(headerDocRef);

  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState({ 
    title: headerContent?.data?.title || defaultTitle, 
    description: headerContent?.data?.description || defaultDescription || "" 
  });

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', `header_${pageId}`), {
        id: `header_${pageId}`,
        pageId: 'headers',
        sectionId: pageId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Header Updated", description: "Custom header content has been saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update header." });
    } finally {
      setIsSaving(false);
    }
  };

  const title = headerContent?.data?.title || defaultTitle;
  const description = headerContent?.data?.description || defaultDescription;

  return (
    <div className="mb-8 relative group">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground text-sm max-w-xl">{description}</p>}
        </div>
        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>
      
      {isAdmin && isEditMode && (
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="absolute -top-2 -right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Page Header</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Page Description</Label>
                <Textarea value={data.description} onChange={(e) => setData({ ...data, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
