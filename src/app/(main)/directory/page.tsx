'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { User } from '@/lib/definitions';
import { UserCard } from '@/components/user-card';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { ADMIN_EMAIL } from '@/lib/config';

export default function DirectoryPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  
  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  
  const { data: users, isLoading } = useCollection<User>(usersCollectionRef);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const handleDeleteUser = async (userId: string) => {
    if (!firestore || !isAdmin) return;
    const userDocRef = doc(firestore, 'users', userId);
    await deleteDoc(userDocRef);
    // Note: This does not delete the user from Firebase Authentication
  };

  const filteredUsers = users
    ? users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (activeTab === 'all' || user.role === activeTab) &&
        (isAdmin || user.isVisibleInDirectory) // Admins see all, others see visible
      )
    : [];

  const renderUserGrid = (usersToRender: User[]) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      );
    }

    if (!usersToRender || usersToRender.length === 0) {
        return <p className="text-muted-foreground text-center mt-8">No users found.</p>
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {usersToRender.map((user) => (
          <UserCard key={user.id} user={user} isAdmin={isAdmin} handleDeleteUser={handleDeleteUser} />
        ))}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Alumni Directory">
        <Input 
          placeholder="Search alumni..." 
          className="w-64" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="student">Students</TabsTrigger>
          <TabsTrigger value="professor">Professors</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {renderUserGrid(filteredUsers.filter(u => activeTab === 'all'))}
        </TabsContent>
        <TabsContent value="student" className="mt-6">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'student'))}
        </TabsContent>
        <TabsContent value="professor" className="mt-6">
          {renderUserGrid(filteredUsers.filter(u => u.role === 'professor'))}
        </TabsContent>
      </Tabs>
    </>
  );
}
