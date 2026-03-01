
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ArrowRight } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, limit, orderBy, where } from 'firebase/firestore';
import type { User, Event } from '@/lib/definitions';
import Link from 'next/link';

export default function DashboardPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser } = useDoc<User>(userDocRef);

  const recentUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(10)
    );
  }, [firestore]);

  const { data: users } = useCollection<User>(recentUsersQuery);

  const upcomingEventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'), limit(3));
  }, [firestore]);

  const { data: events } = useCollection<Event>(upcomingEventsQuery);

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl font-bold font-headline leading-tight">Alumni Network</h1>
           <Link href="/login">
            <Button size="sm">Log In</Button>
           </Link>
        </div>
        
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-headline text-primary">Alumni Spotlights</h2>
            <Link href="/directory">
              <Button variant="link" size="sm" className="text-muted-foreground p-0">View All</Button>
            </Link>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {users?.map((u) => (
                <Link key={u.id} href={`/users/${u.id}`} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-all">
                    <AvatarImage src={u.avatarUrl} />
                    <AvatarFallback>{u.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{u.name?.split(' ')[0]}</span>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>

        <Card className="max-w-md w-full text-center p-8 space-y-6 mx-auto">
          <CardHeader>
            <CardTitle>Personalize Your Experience</CardTitle>
            <CardDescription>Log in to view your personalized dashboard, private messages, and network updates.</CardDescription>
          </CardHeader>
          <Link href="/login">
            <Button className="w-full font-bold h-12">Log In to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20 ring-offset-2">
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>{currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-headline leading-tight">Hello {currentUser?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-muted-foreground">Stay connected with your alumni network!</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-background"></span>
        </Button>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-headline text-primary">Alumni Spotlights</h2>
          <Link href="/directory">
            <Button variant="link" size="sm" className="text-muted-foreground p-0">View All</Button>
          </Link>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {users?.map((u) => (
              <Link key={u.id} href={`/users/${u.id}`} className="flex flex-col items-center gap-2 group cursor-pointer">
                <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-all">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback>{u.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{u.name?.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <section>
        <h2 className="text-lg font-bold font-headline text-primary mb-4">Upcoming Events</h2>
        <div className="space-y-4">
          {events && events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="p-4 bg-muted/30 border-none">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 shrink-0">
                    <span className="text-[10px] font-bold uppercase">{event.date.split(' ')[0]}</span>
                    <span className="text-xl font-bold leading-none">{event.date.split(' ')[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate">{event.name}</h3>
                    <p className="text-[11px] text-muted-foreground truncate">{event.description}</p>
                  </div>
                  <Link href="/events">
                    <Button size="icon" variant="ghost" className="text-primary hover:text-primary/80 shrink-0">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
          )}
        </div>
      </section>
    </div>
  );
}
