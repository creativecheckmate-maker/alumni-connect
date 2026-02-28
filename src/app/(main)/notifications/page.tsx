
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus, Calendar, Info } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Notification } from '@/lib/definitions';

export default function NotificationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [filter, setFilter] = useState('all');

  const notificationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    let q = query(collection(firestore, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    return q;
  }, [firestore, user]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  const filteredNotifications = notifications?.filter(n => filter === 'all' || n.type === filter) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Notifications" />

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/50 rounded-full">
          <TabsTrigger value="all" className="rounded-full py-1.5 text-xs">All</TabsTrigger>
          <TabsTrigger value="connection" className="rounded-full py-1.5 text-xs">Connections</TabsTrigger>
          <TabsTrigger value="event" className="rounded-full py-1.5 text-xs">Events</TabsTrigger>
          <TabsTrigger value="general" className="rounded-full py-1.5 text-xs">General</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredNotifications.map((n) => (
          <Card key={n.id} className={`border-none ${!n.read ? 'bg-primary/5 ring-1 ring-primary/10' : 'bg-muted/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  n.type === 'connection' ? 'bg-blue-100 text-blue-600' :
                  n.type === 'event' ? 'bg-red-100 text-red-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {n.type === 'connection' && <UserPlus className="h-5 w-5" />}
                  {n.type === 'event' && <Calendar className="h-5 w-5" />}
                  {n.type === 'general' && <Info className="h-5 w-5" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.message}</p>
                    <span className="text-[10px] text-muted-foreground">{n.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                  </div>
                  {!n.read && <Badge variant="default" className="text-[10px] h-4">New</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
