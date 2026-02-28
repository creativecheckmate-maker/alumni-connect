
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Event } from '@/lib/definitions';

export default function EventsPage() {
  const firestore = useFirestore();

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Events" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold font-headline">Upcoming Events</h2>
            {isLoading ? (
                <p>Loading events...</p>
            ) : events && events.length > 0 ? (
                events.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                        <div className="grid md:grid-cols-5">
                            <div className="md:col-span-2 relative h-48 md:h-full">
                                {event.imageUrl ? (
                                    <Image 
                                        src={event.imageUrl} 
                                        alt={event.name} 
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <span className="text-muted-foreground">No Image</span>
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-3">
                                <CardHeader>
                                    <CardTitle>{event.name}</CardTitle>
                                    <CardDescription>{event.date}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button>RSVP</Button>
                                </CardFooter>
                            </div>
                        </div>
                    </Card>
                ))
            ) : (
                <p className="text-muted-foreground">No events found.</p>
            )}
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">Calendar</h2>
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={new Date()}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
