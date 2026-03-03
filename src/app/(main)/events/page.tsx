'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { Event } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';

export default function EventsPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const isAdmin = authUser?.email === ADMIN_EMAIL;
  const [isPosting, setIsPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const [eventImageUrl, setEventImageUrl] = useState<string | null>(null);

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'), orderBy('date', 'asc'));
  }, [firestore]);

  const { data: events, isLoading } = useCollection<Event>(eventsQuery);

  const handleAddEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !authUser) return;
    setIsPosting(true);

    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(firestore, 'events'), {
        name: formData.get('name'),
        date: formData.get('date'),
        description: formData.get('description'),
        organizerId: authUser.uid,
        imageUrl: eventImageUrl || `https://picsum.photos/seed/${Math.random()}/800/400`,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Event Created", description: "The event has been added to the calendar." });
      setEventImageUrl(null);
      setOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to create event." });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'events', id));
    toast({ title: "Event Deleted", description: "The event has been removed." });
  };

  const handleRSVP = (eventName: string) => {
    if (!authUser) {
      router.push('/login');
      return;
    }
    toast({ title: "RSVP Confirmed", description: `You have successfully registered for ${eventName}.` });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Events">
        {isAdmin && isEditMode && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input name="name" placeholder="e.g. Annual Homecoming" required />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input name="date" placeholder="e.g. August 12, 2024" required />
                </div>
                <div className="space-y-2">
                  <Label>Event Image</Label>
                  <div className="flex gap-2">
                    <Input value={eventImageUrl || ""} placeholder="Image URL" readOnly />
                    <CldUploadWidget 
                      uploadPreset="ml_default"
                      options={{ 
                        cloudName: "dnex9nw0f", 
                        cropping: true, 
                        multiple: false,
                        showSkipCropButton: false
                      }}
                      onSuccess={(result: any) => setEventImageUrl(result.info.secure_url)}
                    >
                      {({ open }) => (
                        <Button type="button" variant="outline" onClick={() => open()}>
                          <Upload className="h-4 w-4 mr-2" /> Upload & Crop
                        </Button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Details about the event..." required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isPosting}>
                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold font-headline">Upcoming Events</h2>
            {isLoading ? (
                <div className="space-y-4">
                   {[1, 2].map(i => <div key={i} className="h-48 w-full bg-muted animate-pulse rounded-xl" />)}
                </div>
            ) : events && events.length > 0 ? (
                events.map((event) => (
                    <Card key={event.id} className="overflow-hidden border-none shadow-sm group">
                        <div className="grid md:grid-cols-5">
                            <div className="md:col-span-2 relative h-48 md:h-full">
                                <Image 
                                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/800/400`} 
                                    alt={event.name} 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <CardHeader className="relative">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle>{event.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1 text-primary font-medium">
                                                <CalendarIcon className="h-3 w-3" /> {event.date}
                                            </CardDescription>
                                        </div>
                                        {isAdmin && isEditMode && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-destructive h-8 w-8" 
                                                onClick={() => handleDeleteEvent(event.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{event.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="secondary" className="w-full md:w-auto font-bold" onClick={() => handleRSVP(event.name)}>RSVP Now</Button>
                                </CardFooter>
                            </div>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <p className="text-muted-foreground">No upcoming events found.</p>
                </div>
            )}
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-headline">Calendar</h2>
          <Card className="border-none shadow-sm">
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