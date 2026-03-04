'use client';

import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { User, Friendship } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

export default function ChatListPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  // 1. Fetch mutual friendships in real-time
  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'friendships'), 
      where('uids', 'array-contains', authUser.uid),
      where('status', '==', 'mutual')
    );
  }, [firestore, authUser?.uid]);

  const { data: friendships, isLoading: isFriendshipsLoading } = useCollection<Friendship>(friendshipQuery);

  // 2. Extract IDs of mutual friends
  const mutualUserIds = useMemo(() => {
    if (!friendships || !authUser) return [];
    return friendships
      .map(f => f.uids.find(id => id !== authUser.uid))
      .filter(Boolean) as string[];
  }, [friendships, authUser]);

  // 3. Fetch user profiles for mutual friends in real-time to track 'isOnline'
  const friendsQuery = useMemoFirebase(() => {
    if (!firestore || mutualUserIds.length === 0) return null;
    // Firestore 'in' query supports up to 30 items
    return query(
      collection(firestore, 'users'), 
      where('id', 'in', mutualUserIds.slice(0, 30))
    );
  }, [firestore, mutualUserIds]);

  const { data: mutualUsers, isLoading: isUsersLoading } = useCollection<User>(friendsQuery);

  const isLoading = isFriendshipsLoading || (mutualUserIds.length > 0 && isUsersLoading);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <PageHeader title="Private Chats" description="Real-time secure messaging with your mutual connections. Messages are fully private and encrypted." />

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <Card key={i} className="h-24 bg-muted animate-pulse rounded-2xl border-none" />)
        ) : mutualUsers && mutualUsers.length > 0 ? (
          mutualUsers.map((friend) => (
            <Link key={friend.id} href={`/messages/chat/${friend.id}`}>
              <Card className="border-none shadow-sm hover:shadow-md hover:bg-primary/5 transition-all group cursor-pointer overflow-hidden mb-3">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className={`h-14 w-14 ring-2 ${friend.isOnline ? 'ring-green-500/20' : 'ring-primary/10'}`}>
                        <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                        <AvatarFallback className="font-bold">{friend.name?.[0]}</AvatarFallback>
                      </Avatar>
                      {friend.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full animate-in zoom-in duration-300"></span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-black text-lg tracking-tight">{friend.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-4 font-black uppercase tracking-widest">{friend.role}</Badge>
                        <p className={`text-xs font-bold ${friend.isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {friend.isOnline ? 'Online now' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary group-hover:translate-x-1 transition-transform">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="text-center py-32 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <MessageCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-black text-xl text-muted-foreground">No active chats</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
              Connect with alumni in the **Network** to start your first secure conversation.
            </p>
            <Link href="/messages/network" className="inline-block mt-6">
              <Button className="font-black rounded-xl px-8">Explore Network</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
