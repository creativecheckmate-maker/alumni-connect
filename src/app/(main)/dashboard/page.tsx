
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, ArrowRight, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { users, events, news } from '@/lib/placeholder-data';
import type { User } from '@/lib/definitions';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser } = useDoc<User>(userDocRef);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20 ring-offset-2">
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>{currentUser?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold font-headline leading-tight">Hello {currentUser?.name?.split(' ')[0]}</h1>
            <p className="text-sm text-muted-foreground">Stay connected with your alma mater!</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full ring-2 ring-background"></span>
        </Button>
      </div>

      {/* Alumni Spotlights */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-headline text-primary">Alumni Spotlights</h2>
          <Button variant="link" size="sm" className="text-muted-foreground p-0">View All</Button>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-all">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{u.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Connect with Batchmates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-headline text-primary">Connect with your Batchmates</h2>
          <Button variant="link" size="sm" className="text-muted-foreground p-0">See all</Button>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {users.map((u) => (
              <Card key={u.id} className="min-w-[140px] text-center p-4 hover:shadow-md transition-shadow">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={u.avatarUrl} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <h3 className="text-sm font-bold truncate">{u.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-3">{u.college}</p>
                <Button size="sm" className="h-7 text-[10px] px-4 rounded-full">Connect</Button>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* News and Updates */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-headline text-primary">News and Updates</h2>
          <Button variant="link" size="sm" className="text-muted-foreground p-0">More News</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.map((item) => (
            <Card key={item.id} className="overflow-hidden group cursor-pointer">
              <div className="relative h-40 w-full overflow-hidden">
                <Image 
                    src={item.imageUrl} 
                    alt={item.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <Badge className="absolute top-2 left-2 bg-primary/90">{item.category}</Badge>
              </div>
              <CardHeader className="p-4 space-y-1">
                <CardTitle className="text-sm font-bold line-clamp-1">{item.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section>
        <h2 className="text-lg font-bold font-headline text-primary mb-4">Upcoming Events</h2>
        {events.map((event) => (
          <Card key={event.id} className="p-4 bg-muted/30 border-none">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 shrink-0">
                <span className="text-[10px] font-bold uppercase">Aug</span>
                <span className="text-xl font-bold leading-none">12</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold truncate">{event.name}</h3>
                <p className="text-[11px] text-muted-foreground truncate">{event.description}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-primary hover:text-primary/80 shrink-0">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
