'use client';

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Search, 
  MessageCircle, 
  UserCheck, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  addDocumentNonBlocking 
} from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc 
} from 'firebase/firestore';
import type { User, Friendship, Message } from '@/lib/definitions';
import { ADMIN_EMAIL, SECONDARY_ADMIN_EMAIL } from '@/lib/config';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MessagesPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdmin = authUser?.email === ADMIN_EMAIL || authUser?.email === SECONDARY_ADMIN_EMAIL;

  // 1. Fetch ALL users for discovery/network
  const allUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isVisibleInDirectory', '==', true));
  }, [firestore]);
  const { data: allUsers } = useCollection<User>(allUsersQuery);

  // 2. Fetch Mutual Friendships
  const friendshipsQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'friendships'), 
      where('uids', 'array-contains', authUser.uid),
      where('status', '==', 'mutual')
    );
  }, [firestore, authUser?.uid]);
  const { data: friendships } = useCollection<Friendship>(friendshipsQuery);

  const mutualFriendIds = friendships?.map(f => f.uids.find(id => id !== authUser?.uid)) || [];
  const friends = allUsers?.filter(u => mutualFriendIds.includes(u.id)) || [];
  const nonFriends = allUsers?.filter(u => !mutualFriendIds.includes(u.id) && u.id !== authUser?.uid) || [];

  // 3. Fetch Messages for Selected Chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid || !selectedUser) return null;
    const chatKey = [authUser.uid, selectedUser.id].sort().join('_');
    return query(
      collection(firestore, 'messages'),
      where('participants', 'array-contains', authUser.uid),
      orderBy('createdAt', 'asc')
    );
  }, [firestore, authUser?.uid, selectedUser]);
  const { data: rawMessages } = useCollection<Message>(messagesQuery);

  // Filter messages specifically for this pair (Firebase allows array-contains for only 1 element)
  const currentChatKey = selectedUser ? [authUser?.uid, selectedUser.id].sort().join('_') : '';
  const messages = rawMessages?.filter(m => m.participants.includes(selectedUser?.id || '')) || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !authUser || !selectedUser || !messageText.trim()) return;

    addDocumentNonBlocking(collection(firestore, 'messages'), {
      senderId: authUser.uid,
      senderName: authUser.displayName || 'Nexus Alumnus',
      senderAvatarUrl: authUser.photoURL || '',
      content: messageText.trim(),
      participants: [authUser.uid, selectedUser.id].sort(),
      createdAt: serverTimestamp(),
    });

    setMessageText('');
  };

  const filteredFriends = friends.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNetwork = nonFriends.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const isEligibleForChat = (user: User) => {
    if (isAdmin) return true;
    return mutualFriendIds.includes(user.id);
  };

  if (!authUser) return null;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-6">
      <PageHeader title="Alumni Hub" description="Connect securely with verified graduates and faculty." />

      <div className="flex-1 flex overflow-hidden rounded-[2rem] shadow-2xl bg-card border border-muted/20">
        {/* Sidebar */}
        <aside className="w-80 border-r flex flex-col bg-muted/5">
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search alumni..." 
                className="pl-9 bg-background h-10 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-primary">Verified Network</span>
            </div>
          </div>

          <Tabs defaultValue="chats" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 h-12 p-1 bg-transparent border-b rounded-none">
              <TabsTrigger value="chats" className="font-bold text-xs data-[state=active]:bg-background">Chats</TabsTrigger>
              <TabsTrigger value="network" className="font-bold text-xs data-[state=active]:bg-background">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="chats" className="flex-1 overflow-y-auto p-2 m-0">
              {filteredFriends.length > 0 ? filteredFriends.map(user => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/50 group",
                    selectedUser?.id === user.id && "bg-primary/5 ring-1 ring-primary/10"
                  )}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-transparent group-hover:ring-primary/20">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="font-bold">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tighter">Mutual Connection</p>
                  </div>
                  <UserCheck className="h-4 w-4 text-primary opacity-40" />
                </div>
              )) : (
                <div className="p-10 text-center space-y-2">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs text-muted-foreground font-bold">No mutual friends yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="network" className="flex-1 overflow-y-auto p-2 m-0">
              {filteredNetwork.map(user => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/50 group",
                    selectedUser?.id === user.id && "bg-muted/80"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tighter">{user.role}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col bg-background relative">
          {!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
              <div className="h-24 w-24 rounded-[2rem] bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h3 className="text-xl font-bold font-headline">Secure Alumni Hub</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Browse the network tab to send connection requests. Once a mutual follow is established, you'll unlock secure communication channels.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted/30 px-4 py-2 rounded-full">
                    <ShieldCheck className="h-3 w-3" /> Encrypted Privacy
                </div>
              </div>
            </div>
          ) : !isEligibleForChat(selectedUser) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6 bg-muted/10">
                <AlertCircle className="h-16 w-16 text-primary opacity-20" />
                <div className="space-y-4 max-w-sm">
                    <h3 className="text-2xl font-bold font-headline">Mutual Connection Required</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        To maintain a professional environment, messaging is restricted to mutual connections. Visit <strong>{selectedUser.name.split(' ')[0]}'s profile</strong> to follow them.
                    </p>
                    <Link href={`/users/${selectedUser.id}`}>
                        <Button className="font-bold h-12 px-10 rounded-xl shadow-lg">View Professional Profile</Button>
                    </Link>
                </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <header className="h-16 border-b px-6 flex items-center justify-between bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <Link href={`/users/${selectedUser.id}`}>
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10 hover:scale-105 transition-transform">
                        <AvatarImage src={selectedUser.avatarUrl} />
                        <AvatarFallback className="font-bold">{selectedUser.name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0">
                    <Link href={`/users/${selectedUser.id}`} className="hover:underline">
                        <h4 className="text-sm font-bold truncate leading-none mb-1">{selectedUser.name}</h4>
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Verified Network</span>
                    </div>
                  </div>
                </div>
                {isAdmin && <div className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase">Admin Connected</div>}
              </header>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {messages.map((m) => (
                    <div 
                      key={m.id} 
                      className={cn(
                        "flex flex-col max-w-[80%] space-y-1",
                        m.senderId === authUser.uid ? "ml-auto items-end" : "items-start"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-[1.5rem] shadow-sm text-sm font-medium",
                        m.senderId === authUser.uid 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted/50 rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                      <div className="flex items-center gap-1 px-2">
                        <Clock className="h-2 w-2 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Footer */}
              <footer className="p-4 border-t bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input 
                    placeholder="Type a professional message..." 
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 bg-muted/20 border-none h-12 px-6 rounded-2xl focus-visible:ring-primary/20"
                  />
                  <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95" disabled={!messageText.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </form>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}