'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Calendar, Info, Bell, Loader2, ShieldAlert, AlertCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/definitions';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [filter, setFilter] = useState('all');

  // Memoized query ensures stable reference for the useCollection hook
  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || isUserLoading) return null;
    
    // Explicit filter by userId ensures privacy and matches security rules requirements
    return query(
      collection(firestore, 'notifications'), 
      where('userId', '==', user.uid), 
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid, isUserLoading]);

  const { data: notifications, isLoading, error: queryError } = useCollection<Notification>(notificationsQuery);

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

  if (queryError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-4">
        <div className="h-16 w-16 bg-destructive/5 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Sync Error</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            We encountered a permissions issue while loading your notifications. Our team has been alerted.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <PageHeader title="Notifications" description="Your secure alumni activity log and connection updates." />

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="all" className="rounded-lg py-2 text-xs font-bold">All</TabsTrigger>
          <TabsTrigger value="connection" className="rounded-lg py-2 text-xs font-bold">Network</TabsTrigger>
          <TabsTrigger value="event" className="rounded-lg py-2 text-xs font-bold">Events</TabsTrigger>
          <TabsTrigger value="general" className="rounded-lg py-2 text-xs font-bold">Info</TabsTrigger>
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
            <p className="text-muted-foreground font-bold">No active notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}