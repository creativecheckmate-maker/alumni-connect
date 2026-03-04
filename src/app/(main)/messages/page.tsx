'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Send, 
  Loader2, 
  ArrowLeft, 
  MessageCircle,
  Radio,
  Video,
  Users as UsersIcon,
  Lock,
  UserPlus,
  UserCheck,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { 
  useUser, 
  useFirestore, 
  useMemoFirebase, 
  useCollection, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  useFirebase
} from '@/firebase';
import { collection, query, where, serverTimestamp, limit, doc, orderBy } from 'firebase/firestore';
import type { User, Message, Friendship } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { moderateContent } from '@/ai/flows/moderation';
import { ADMIN_EMAIL, SECONDARY_ADMIN_EMAIL } from '@/lib/config';
import Link from 'next/link';

export default function MessagesPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'network'>('network');
  const [isSending, setIsSending] = useState(false);
  
  const isAdmin = authUser?.email === ADMIN_EMAIL || authUser?.email === SECONDARY_ADMIN_EMAIL || authUser?.email === 'geminiak8@gmail.com' || authUser?.uid === 'zEyeEyDugUWHv4RYKvgntWLunXH2';
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'friendships'),
      where('uids', 'array-contains', authUser.uid)
    );
  }, [firestore, authUser?.uid]);

  const { data: friendships, isLoading: isFriendshipsLoading } = useCollection<Friendship>(friendshipQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(100)
    );
  }, [firestore, authUser?.uid]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const getFriendshipWith = (otherId: string) => friendships?.find(f => f.uids.includes(otherId));
  const isMutualFriend = (otherId: string) => getFriendshipWith(otherId)?.status === 'mutual';

  const mutualFriendIds = new Set(
    friendships
      ?.filter(f => f.status === 'mutual')
      .map(f => f.uids.find(id => id !== authUser?.uid))
      .filter(Boolean) as string[]
  );

  const displayList = allUsers?.filter(u => {
    if (u.id === authUser?.uid) return false;
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const isMutual = mutualFriendIds.has(u.id);
    
    if (activeTab === 'chats') {
      return isMutual && matchesSearch;
    } else {
      // In 'network' tab, show everyone else (non-mutual)
      return !isMutual && matchesSearch;
    }
  }) || [];

  const selectedUser = allUsers?.find(u => u.id === activeChat);
  const isChatEligible = activeChat ? (isMutualFriend(activeChat) || isAdmin) : false;

  const chatId = activeChat && authUser?.uid 
    ? [authUser.uid, activeChat].sort().join('_') 
    : null;

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId || !authUser?.uid || !isChatEligible) return null;
    
    // Admins can see all messages for moderation; standard users only their own
    let q = query(
      collection(firestore, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    if (!isAdmin) {
      q = query(q, where('participants', 'array-contains', authUser.uid));
    }
    
    return q;
  }, [firestore, chatId, authUser?.uid, isChatEligible, isAdmin]);

  const { data: messages, isLoading: isMessagesLoading, error: messagesError } = useCollection<Message>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

  const handleSendMessage = async () => {
    if (!firestore || !authUser || !activeChat || !messageText.trim() || !chatId || isSending) return;
    
    if (!isChatEligible) {
      toast({ variant: 'destructive', title: "Interaction Locked", description: "Establish a mutual follow to enable secure messaging." });
      return;
    }

    setIsSending(true);
    try {
      const moderation = await moderateContent({ text: messageText });
      if (!moderation.isSafe) {
        toast({ variant: 'destructive', title: "Policy Violation", description: moderation.reason || "Your message violates community standards." });
        setIsSending(false);
        return;
      }

      addDocumentNonBlocking(collection(firestore, 'messages'), {
        senderId: authUser.uid,
        receiverId: activeChat,
        participants: [authUser.uid, activeChat],
        chatId: chatId,
        text: messageText,
        status: 'sent',
        createdAt: serverTimestamp(),
      });
      setMessageText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleFollowUser = async (otherId: string) => {
    if (!firestore || !authUser) return;
    const friendshipId = [authUser.uid, otherId].sort().join('_');
    const existing = getFriendshipWith(otherId);

    if (existing) {
      if (existing.followedBy.includes(authUser.uid)) return;
      const newFollowedBy = [...existing.followedBy, authUser.uid];
      const isMutual = newFollowedBy.length === 2;
      
      updateDocumentNonBlocking(doc(firestore, 'friendships', existing.id), {
        followedBy: newFollowedBy,
        status: isMutual ? 'mutual' : 'pending',
        updatedAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: otherId,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} followed you back! Chat is now unlocked.`,
        read: false,
        createdAt: serverTimestamp()
      });
    } else {
      setDocumentNonBlocking(doc(firestore, 'friendships', friendshipId), {
        id: friendshipId,
        uids: [authUser.uid, otherId],
        followedBy: [authUser.uid],
        status: 'pending',
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: otherId,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} sent you a connection request.`,
        read: false,
        createdAt: serverTimestamp()
      });
    }
    toast({ title: "Status Updated", description: "Relationship synchronized." });
  };

  if (!authUser && !isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-none">
          <Lock className="h-16 w-16 text-primary mx-auto opacity-20" />
          <h2 className="text-2xl font-bold font-headline">Secure Access Required</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Log in to establish connections and unlock encrypted interaction channels with the Nexus community.</p>
          <Button asChild className="w-full font-bold h-12 rounded-xl">
            <Link href="/login">Log In to Nexus</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 flex-col md:flex-row max-w-6xl mx-auto w-full">
      <Card className={`w-full md:w-80 flex flex-col overflow-hidden border-none shadow-xl ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b space-y-4 bg-muted/10">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="chats" className="text-xs font-bold gap-2">
                <MessageCircle className="h-3.5 w-3.5" /> Mutual
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs font-bold gap-2">
                <UsersIcon className="h-3.5 w-3.5" /> Discovery
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search alumni..."
              className="pl-9 bg-background border-none rounded-xl h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {isUsersLoading || isFriendshipsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-20" /></div>
            ) : displayList.length > 0 ? (
              displayList.map((user) => {
                const f = getFriendshipWith(user.id);
                const isMutual = f?.status === 'mutual';
                const isRequested = f?.followedBy.includes(authUser?.uid || '') && !isMutual;

                return (
                  <div 
                    key={user.id} 
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${activeChat === user.id ? 'bg-primary/10 text-primary shadow-inner' : 'hover:bg-muted/50'}`}
                    onClick={() => setActiveChat(user.id)}
                  >
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="font-bold">{user.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">
                        {isMutual ? 'Connected' : (isRequested ? 'Request Sent' : 'Discovery')}
                      </p>
                    </div>
                    {activeTab === 'network' && (
                      <Button size="sm" variant="outline" className="px-3 rounded-full text-[9px] h-7 border-primary/20 text-primary" onClick={(e) => { e.stopPropagation(); handleFollowUser(user.id); }}>
                        {isRequested ? "Pending" : "Connect"}
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 px-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeTab === 'chats' ? 'Establish mutual follows in the Discovery tab to unlock conversations.' : 'No alumni profiles found matching your search criteria.'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className={`flex-1 flex flex-col overflow-hidden border-none shadow-2xl ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            <div className={`p-4 border-b flex items-center justify-between z-10 ${isChatEligible ? 'bg-zinc-900 text-white shadow-lg' : 'bg-muted/30'}`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2"><ArrowLeft className="h-6 w-6" /></button>
                <Link href={`/users/${selectedUser.id}`}>
                  <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-background hover:scale-105 transition-all">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-black">{selectedUser.name?.[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/users/${selectedUser.id}`} className="text-base font-black hover:underline">{selectedUser.name}</Link>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <Radio className={`h-3 w-3 ${isChatEligible ? 'text-green-500 animate-pulse' : 'text-zinc-600'}`} /> {isChatEligible ? 'SECURE CHANNEL ACTIVE' : 'PRIVATE CHANNEL LOCKED'}
                  </p>
                </div>
              </div>
              {isChatEligible && (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-11 w-11 text-blue-400 hover:bg-blue-500/10 rounded-xl"><Video className="h-6 w-6" /></Button>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 p-6 bg-zinc-50/50">
              {isChatEligible ? (
                <div className="space-y-8 max-w-4xl mx-auto">
                  {isMessagesLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" /></div>
                  ) : messagesError ? (
                    <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/10">
                        <ShieldAlert className="h-10 w-10 text-destructive mx-auto mb-4 opacity-40" />
                        <p className="text-sm font-bold text-destructive">Authorization Error</p>
                        <p className="text-xs text-muted-foreground mt-1 px-10">Access to this private interaction channel has been denied by Nexus security.</p>
                    </div>
                  ) : messages && messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${msg.senderId === authUser?.uid ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200'}`}>
                            <p className="text-sm font-medium">{msg.text}</p>
                            <div className={`flex items-center gap-2 mt-3 ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}>
                              <p className="text-[10px] font-black uppercase opacity-40">{msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}</p>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-20">
                        <p className="text-xs text-muted-foreground italic">Your secure interaction with {selectedUser.name} has begun.</p>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 max-w-sm mx-auto">
                  <div className="h-24 w-24 rounded-[2.5rem] bg-muted/20 flex items-center justify-center relative">
                    <UsersIcon className="h-10 w-10 text-muted-foreground" />
                    <Lock className="h-6 w-6 text-primary absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-black uppercase">Mutual Connection Required</h3>
                    <p className="text-sm text-muted-foreground font-medium">Interaction channels are only unlocked once both individuals follow each other to ensure network privacy.</p>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    <Button className="w-full h-12 rounded-xl font-bold" onClick={() => handleFollowUser(selectedUser.id)}>
                      {getFriendshipWith(selectedUser.id)?.followedBy.includes(authUser?.uid || '') ? "Request Pending" : "Follow Back to Unlock Chat"}
                    </Button>
                    <Link href={`/users/${selectedUser.id}`} className="w-full"><Button variant="ghost" className="w-full h-12 rounded-xl font-bold">View Nexus Profile</Button></Link>
                  </div>
                </div>
              )}
            </ScrollArea>

            {isChatEligible && (
              <div className="p-5 border-t bg-white/80 backdrop-blur-xl">
                <form className="flex gap-3 max-w-4xl mx-auto" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                  <Input 
                    placeholder="Type a secure message..." 
                    className="bg-zinc-100 border-none rounded-[1.25rem] h-12 px-6 font-medium"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" className="rounded-2xl h-12 w-12 bg-zinc-900 transition-all hover:scale-105 active:scale-95" disabled={!messageText.trim() || isSending}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-zinc-50/30">
            <ShieldCheck className="h-20 w-20 text-primary opacity-20 mb-8" />
            <h3 className="font-black text-3xl text-zinc-900 tracking-tighter">SECURE NEXUS HUB</h3>
            <p className="text-sm max-w-xs text-muted-foreground mt-3">Establish mutual follows to create private, encrypted interaction channels within the alumni community.</p>
          </div>
        )}
      </Card>
    </div>
  );
}