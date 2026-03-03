'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; 
import type { User, Friendship } from '@/lib/definitions';
import { UserCard } from '@/components/user-card';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_EMAIL } from '@/lib/config';

export default function DirectoryPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const isAdmin = authUser?.email === ADMIN_EMAIL;
  
  const usersCollectionRef = useMemoFirebase(
    () => {
        if (!firestore) return null;
        const baseQuery = collection(firestore, 'users');
        
        if (isAdmin) {
            return baseQuery;
        }
        return query(baseQuery, where('isVisibleInDirectory', '==', true));
    },
    [firestore, isAdmin]
  );
  
  const { data: users, isLoading } = useCollection<User>(usersCollectionRef);

  // Optimization: Fetch all friendships for the current user once
  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(collection(firestore, 'friendships'), where('uids', 'array-contains', authUser.uid));
  }, [firestore, authUser?.uid]);

  const { data: friendships } = useCollection<Friendship>(friendshipQuery);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleDeleteUser = async (userId: string) => {
    if (!firestore || !isAdmin) return;
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
  };

  const filteredUsers = users
    ? users.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
        (activeTab === 'all' || user.role === activeTab)
      )
    : [];

  const renderUserGrid = (usersToRender: User[]) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      );
    }

    if (!usersToRender || usersToRender.length === 0) {
        return (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <p className="text-muted-foreground font-medium">No alumni found matching your criteria.</p>
          </div>
        );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usersToRender.map((user) => (
          <UserCard 
            key={user.id} 
            user={user} 
            isAdmin={isAdmin} 
            handleDeleteUser={handleDeleteUser} 
            friendships={friendships || []}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <PageHeader title="Alumni Directory" description="Connect with fellow graduates and explore our global network."> 
        <div className="relative">
          <Input 
            placeholder="Search by name..." 
            className="w-64 pl-4 bg-card" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-xl mb-8">
          <TabsTrigger value="all" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">All Alumni</TabsTrigger>
          <TabsTrigger value="student" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">Students</TabsTrigger>
          <TabsTrigger value="professor" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">Professors</TabsTrigger>
          <TabsTrigger value="non-teaching-staff" className="rounded-lg px-6 font-bold data-[state=active]:bg-white data-[state=active]:text-primary">Staff</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers)}
        </TabsContent>
        <TabsContent value="student" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'student'))}
        </TabsContent>
        <TabsContent value="professor" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'professor'))}
        </TabsContent> 
        <TabsContent value="non-teaching-staff" className="focus-visible:ring-0">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'non-teaching-staff'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
