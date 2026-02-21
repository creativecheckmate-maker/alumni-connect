import { PageHeader } from '@/components/page-header';
import { events } from '@/lib/placeholder-data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function EventsPage() {
  return (
    <>
      <PageHeader title="Events" />
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold font-headline">Upcoming Events</h2>
            {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                    <div className="grid md:grid-cols-5">
                        <div className="md:col-span-2">
                             <Image 
                                src={event.image.imageUrl} 
                                alt={event.image.description} 
                                width={400} 
                                height={250} 
                                className="object-cover w-full h-full"
                                data-ai-hint={event.image.imageHint}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <CardHeader>
                                <CardTitle>{event.name}</CardTitle>
                                <CardDescription>{format(new Date(event.date), "MMMM d, yyyy 'at' h:mm a")}</CardDescription>
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
            ))}
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
    </>
  );
}
