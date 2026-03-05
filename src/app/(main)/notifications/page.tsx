'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Calendar, Info, Bell, Loader2, ShieldAlert, Edit } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Notification, SiteContent } from '@/lib/definitions';
import Link from 'next/link';
import { ADMIN_EMAIL } from '@/lib/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

function AdminEditDialog({ pageId, sectionId, initialData, label, overlay = false }: { pageId: string, sectionId: string, initialData: any, label: string, overlay?: boolean }) {
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
      toast({ variant: 'destructive', title: "Error", description: "Failed to update." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className={`${overlay ? 'absolute top-2 right-2 z-50' : 'ml-2'} h-8 w-8 rounded-full shadow-lg`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => (
            <div key={key} className="space-y-2">
              <label className="capitalize text-xs font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
              <Input 
                value={data[key] || ""} 
                onChange={(e) => setData({ ...data, [key]: e.target.value })} 
              />
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

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const { isEditMode } = useFirebase();
  const firestore = useFirestore();
  const [filter, setFilter] = useState('all');
  const isAdmin = user?.email === ADMIN_EMAIL;

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'notifications_tabs'), [firestore]);
  const { data: tabsContent } = useDoc<SiteContent>(contentDocRef);

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'notifications'), 
      where('userId', '==', user.uid), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const defaultTabs = {
    all: "All",
    connection: "Network",
    event: "Events",
    general: "Info",
    emptyMessage: "No active notifications found."
  };

  const tabs = tabsContent?.data || defaultTabs;
  const filteredNotifications = notifications?.filter(n => filter === 'all' || n.type === filter) || [];

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-xl border-none bg-card/50 backdrop-blur-sm">
          <div className="h-20 w-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert className="h-10 w-10 text-primary opacity-40" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Private Alerts</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Log in to see your personalized network activity, connection requests, and career alerts.
            </p>
          </div>
          <Link href="/login" className="block">
            <Button className="w-full font-bold h-12 rounded-xl shadow-lg">Log In to Notifications</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <PageHeader title="Notifications" description="Your secure alumni activity log and connection updates.">
        {isAdmin && isEditMode && <AdminEditDialog pageId="notifications" sectionId="tabs" initialData={tabs} label="Tab Labels" />}
      </PageHeader>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="all" className="rounded-lg py-2 text-xs font-bold">{tabs.all}</TabsTrigger>
          <TabsTrigger value="connection" className="rounded-lg py-2 text-xs font-bold">{tabs.connection}</TabsTrigger>
          <TabsTrigger value="event" className="rounded-lg py-2 text-xs font-bold">{tabs.event}</TabsTrigger>
          <TabsTrigger value="general" className="rounded-lg py-2 text-xs font-bold">{tabs.general}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl" />)
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <Card key={n.id} className={`border-none transition-all hover:bg-white shadow-sm ${!n.read ? 'bg-primary/5 ring-1 ring-primary/10' : 'bg-card'}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    n.type === 'connection' ? 'bg-blue-100 text-blue-600' :
                    n.type === 'event' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {n.type === 'connection' && <UserPlus className="h-6 w-6" />}
                    {n.type === 'event' && <Calendar className="h-6 w-6" />}
                    {n.type === 'general' && <Info className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm leading-snug line-clamp-2 ${!n.read ? 'font-bold' : 'font-medium text-muted-foreground'}`}>
                        {n.message}
                      </p>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">
                        {n.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                      </span>
                    </div>
                    {!n.read && <Badge variant="default" className="text-[9px] h-4 px-1.5 font-bold uppercase">New</Badge>}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold">{tabs.emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
