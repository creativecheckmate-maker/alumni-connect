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
import { Plus, Trash2, Loader2, Calendar as CalendarIcon, Upload, Scissors } from 'lucide-react';
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
      toast({ title: "Published", description: "The event is now live." });
      setEventImageUrl(null);
      setOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to publish event." });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'events', id));
    toast({ title: "Event Removed", description: "Listing has been deleted." });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader title="Global Events" description="Discover reunions, workshops, and summits across our network.">
        {isAdmin && isEditMode && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl h-11 font-bold shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4" /> Create New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Event Builder</DialogTitle>
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
                  <Label>Event Banner</Label>
                  <div className="flex gap-2">
                    <Input value={eventImageUrl || ""} placeholder="No image selected" readOnly className="bg-muted/50" />
                    <CldUploadWidget 
                      uploadPreset="ml_default"
                      options={{ 
                        cloudName: "dnex9nw0f", 
                        cropping: true, 
                        showSkipCropButton: false,
                        croppingAspectRatio: 1.77,
                        croppingDefaultSelection: 'transform',
                        croppingShowBackButton: true,
                        multiple: false
                      }}
                      onSuccess={(result: any) => setEventImageUrl(result.info.secure_url)}
                    >
                      {({ open }) => (
                        <Button type="button" variant="outline" className="gap-2 font-bold" onClick={() => open()}>
                          <Scissors className="h-4 w-4" /> Crop & Upload
                        </Button>
                      )}
                    </CldUploadWidget>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" placeholder="Agenda and location details..." required className="min-h-[100px]" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isPosting} className="w-full h-12 font-bold">
                    {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Timeline</h2>
            {isLoading ? (
                <div className="space-y-4">
                   {[1, 2].map(i => <div key={i} className="h-48 w-full bg-muted animate-pulse rounded-2xl" />)}
                </div>
            ) : events && events.length > 0 ? (
                events.map((event) => (
                    <Card key={event.id} className="overflow-hidden border-none shadow-lg group bg-card">
                        <div className="grid md:grid-cols-5">
                            <div className="md:col-span-2 relative h-48 md:h-full overflow-hidden">
                                <Image 
                                    src={event.imageUrl || `https://picsum.photos/seed/${event.id}/800/400`} 
                                    alt={event.name} 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="md:col-span-3 p-2">
                                <CardHeader className="relative">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <CardTitle className="text-xl font-black">{event.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1.5 text-primary font-black uppercase tracking-widest text-[10px]">
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
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">{event.description}</p>
                                </CardContent>
                                <CardFooter className="pt-0">
                                    <Button variant="secondary" className="w-full md:w-auto font-black px-8 h-11 rounded-xl">Confirm Attendance</Button>
                                </CardFooter>
                            </div>
                        </div>
                    </Card>
                ))
            ) : (
                <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
                    <p className="text-muted-foreground font-bold">No active events.</p>
                </div>
            )}
        </div>
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-headline tracking-tight">Calendar</h2>
          <Card className="border-none shadow-xl bg-card rounded-[2rem] overflow-hidden">
            <CardContent className="p-4">
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