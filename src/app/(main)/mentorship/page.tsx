
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, SiteContent } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';
import { useState } from 'react';
import { Edit, Loader2, Search, GraduationCap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function AdminEditDialog({ initialData }: { initialData: any }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', 'mentorship_main'), {
        id: 'mentorship_main',
        pageId: 'mentorship',
        sectionId: 'main',
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: "Mentorship description saved." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save content." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 ml-2">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Page Description</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label>Page Description</Label>
          <Textarea 
            value={data.description} 
            onChange={(e) => setData({ description: e.target.value })} 
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MentorshipPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'mentorship_main'), [firestore]);
  const { data: mainContent } = useDoc<SiteContent>(contentDocRef);

  const mentorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', 'in', ['professor', 'non-teaching-staff']));
  }, [firestore]);

  const { data: mentors } = useCollection<User>(mentorsQuery);

  const defaultDescription = "Find and connect with experienced alumni and faculty members who are ready to guide your professional journey.";
  const description = mainContent?.data?.description || defaultDescription;

  const filteredMentors = mentors?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader title="Mentorship Program">
        <div className="flex items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Search mentors..." 
                className="w-64 pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <Button variant="outline" className="font-bold">Become a Mentor</Button>
          {isAdmin && <AdminEditDialog initialData={{ description }} />}
        </div>
      </PageHeader>
      
      <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl">
        {description}
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-20">
        {filteredMentors.length > 0 ? (
          filteredMentors.map((mentor) => (
            <Card key={mentor.id} className="text-center border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              <CardContent className="p-8">
                <Avatar className="h-28 w-28 mx-auto mb-6 ring-4 ring-primary/5 ring-offset-4 transition-transform group-hover:scale-105">
                  <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
                  <AvatarFallback className="text-2xl font-bold bg-muted">{getInitials(mentor.name)}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{mentor.name}</h3>
                <p className="text-sm text-muted-foreground font-medium mb-4 flex items-center justify-center gap-1">
                  {mentor.role === 'professor' ? (
                    <>
                      <GraduationCap className="h-3.5 w-3.5" /> {mentor.department}
                    </>
                  ) : 'Nexus Alumnus'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="capitalize font-bold px-3 py-1">
                    {mentor.role === 'non-teaching-staff' ? 'Staff' : mentor.role}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="p-0 border-t">
                <Button variant="ghost" className="w-full h-14 font-bold rounded-none hover:bg-primary/5 text-primary" onClick={() => toast({ title: "Request Sent", description: `Mentorship request sent to ${mentor.name.split(' ')[0]}.` })}>
                  Request Connection
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-muted/20 rounded-2xl border-2 border-dashed">
            <p className="text-muted-foreground font-medium">No mentors available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
