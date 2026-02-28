
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { useState } from 'react';

export default function MentorshipPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const mentorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Mentors are usually professors or senior staff, or students who have graduated (year < current)
    // For simplicity, let's filter by role professor
    return query(collection(firestore, 'users'), where('role', 'in', ['professor', 'non-teaching-staff']));
  }, [firestore]);

  const { data: mentors } = useCollection<User>(mentorsQuery);

  const filteredMentors = mentors?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Mentorship Program">
        <div className="flex gap-2">
          <Input 
            placeholder="Search mentors..." 
            className="w-64" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline">Become a Mentor</Button>
        </div>
      </PageHeader>
      <p className="text-muted-foreground mb-6">Find and connect with experienced alumni and faculty.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMentors.map((mentor) => (
          <Card key={mentor.id} className="text-center">
            <CardContent className="p-6">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
                <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">{mentor.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{mentor.role === 'professor' ? mentor.department : 'Alumni'}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">{mentor.role}</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Connect</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
