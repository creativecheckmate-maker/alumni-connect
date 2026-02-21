'use client';

import { useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import type { User } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserCard } from '@/components/user-card';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'users'), where('isVisibleInDirectory', '==', true))
        : null,
    [firestore]
  );

  const { data: users, isLoading } = useCollection<User>(usersCollectionRef);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredUsers = users
    ? users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (activeTab === 'all' || user.role === activeTab)
      )
    : [];

  const renderUserGrid = (usersToRender: User[]) => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      );
    }

    if (!usersToRender || usersToRender.length === 0) {
        return <p className="text-muted-foreground text-center mt-8">No publicly visible users found.</p>
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {usersToRender.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  };
  
  const students = filteredUsers.filter(u => u.role === 'student');
  const professors = filteredUsers.filter(u => u.role === 'professor');

  return (
    <div className="flex min-h-screen w-full flex-col">
       <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 justify-between z-50">
            <Link href="/" className="flex items-center gap-2">
                <Logo className="h-8" />
            </Link>
            <div className="flex gap-2">
                <Link href="/login">
                    <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/login">
                    <Button>Sign Up</Button>
                </Link>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
             <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline tracking-tight">Alumni Directory</h1>
                <Input 
                  placeholder="Search alumni..." 
                  className="w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
      
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="student">Students</TabsTrigger>
                  <TabsTrigger value="professor">Professors</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-6">
                  {renderUserGrid(filteredUsers)}
                </TabsContent>
                <TabsContent value="student" className="mt-6">
                  {renderUserGrid(students)}
                </TabsContent>
                <TabsContent value="professor" className="mt-6">
                  {renderUserGrid(professors)}
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
