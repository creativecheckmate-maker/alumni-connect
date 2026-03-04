'use client';

import { PageHeader } from '@/components/page-header';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc, getDoc } from 'firebase/firestore';
import type { User, Friendship } from '@/lib/definitions';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight, Loader2, Ghost } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ChatListPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [mutualUsers, setMutualUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'friendships'), 
      where('uids', 'array-contains', authUser.uid),
      where('status', '==', 'mutual')
    );
  }, [firestore, authUser?.uid]);

  const { data: friendships, isLoading: isFriendshipsLoading } = useCollection<Friendship>(friendshipQuery);

  useEffect(() => {
    async function fetchMutualUsers() {
      if (!firestore || !friendships || !authUser) {
        if (!isFriendshipsLoading) setIsDataLoading(false);
        return;
      }

      setIsDataLoading(true);
      const users: User[] = [];
      
      try {
        for (const friendship of friendships) {
          const otherUserId = friendship.uids.find(id => id !== authUser.uid);
          if (otherUserId) {
            const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
            if (userDoc.exists()) {
              users.push({ ...userDoc.data() as User, id: userDoc.id });
            }
          }
        }
        setMutualUsers(users);
      } catch (e) {
        console.error("Error fetching mutual users:", e);
      } finally {
        setIsDataLoading(false);
      }
    }

    fetchMutualUsers();
  }, [firestore, friendships, authUser, isFriendshipsLoading]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <PageHeader title="Private Chats" description="Real-time secure messaging with your mutual connections. Messages are fully private and encrypted." />

      <div className="space-y-3">
        {isFriendshipsLoading || isDataLoading ? (
          [1, 2, 3].map(i => <Card key={i} className="h-24 bg-muted animate-pulse rounded-2xl border-none" />)
        ) : mutualUsers.length > 0 ? (
          mutualUsers.map((friend) => (
            <Link key={friend.id} href={`/messages/chat/${friend.id}`}>
              <Card className="border-none shadow-sm hover:shadow-md hover:bg-primary/5 transition-all group cursor-pointer overflow-hidden mb-3">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                        <AvatarImage src={friend.avatarUrl} alt={friend.name} />
                        <AvatarFallback className="font-bold">{friend.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-black text-lg tracking-tight">{friend.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] h-4 font-black uppercase tracking-widest">{friend.role}</Badge>
                        <p className="text-xs text-muted-foreground font-medium">Online now</p>
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
