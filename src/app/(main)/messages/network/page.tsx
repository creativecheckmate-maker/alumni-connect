'use client';

import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User, Friendship } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, UserPlus, ShieldCheck, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function NetworkPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isVisibleInDirectory', '==', true));
  }, [firestore]);

  const { data: users, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(collection(firestore, 'friendships'), where('uids', 'array-contains', authUser.uid));
  }, [firestore, authUser?.uid]);

  const { data: friendships } = useCollection<Friendship>(friendshipQuery);

  const filteredUsers = users?.filter(u => 
    u.id !== authUser?.uid && 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <PageHeader title="Authorized Network" description="Connect and start a secure conversation with any verified member of the Nexus network.">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Find someone..." 
            className="w-64 pl-9 bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </PageHeader>

      {isUsersLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => {
            const friendship = friendships?.find(f => f.uids.includes(user.id));
            const isMutual = friendship?.status === 'mutual';
            const isOnline = !!user.isOnline;
            
            return (
              <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className={`h-14 w-14 ring-2 ${isOnline ? 'ring-green-500/20' : 'ring-primary/5'} transition-transform group-hover:scale-105`}>
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="bg-muted font-bold text-lg">{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base truncate group-hover:text-primary transition-colors">{user.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{user.college}</p>
                      <Badge variant="outline" className="mt-1 text-[9px] uppercase font-black tracking-tighter">Verified Member</Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isMutual ? (
                      <>
                        <Link href={`/messages/chat/${user.id}`} className="flex-1">
                          <Button className="w-full h-10 gap-2 font-bold bg-muted/50 text-foreground hover:bg-muted">
                            <MessageSquare className="h-4 w-4" /> Message
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link href={`/users/${user.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full h-10 gap-2 font-bold">
                          <UserPlus className="h-4 w-4" /> Connect to Chat
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-muted/20 rounded-[2rem] border-2 border-dashed">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold">No verified members found.</p>
        </div>
      )}
    </div>
  );
}
