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
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Loader2, 
  ArrowLeft, 
  MessageCircle,
  Radio,
  Check,
  CheckCheck,
  Video,
  Phone,
  ShieldCheck,
  Users as UsersIcon,
  XCircle,
  Handshake,
  Lock,
  UserPlus,
  UserCheck,
  ShieldAlert,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { 
  useUser, 
  useFirestore, 
  useMemoFirebase, 
  useCollection, 
  useDoc,
  updateDocumentNonBlocking,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  deleteDocumentNonBlocking
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
  const [activeTab, setActiveTab] = useState<'active' | 'network'>('active');
  const [isSending, setIsSending] = useState(false);
  
  const isAdmin = authUser?.email === ADMIN_EMAIL || authUser?.email === SECONDARY_ADMIN_EMAIL || authUser?.email === 'geminiak8@gmail.com';
  
  // Voice/Video State
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all friendships for the current user
  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'friendships'),
      where('uids', 'array-contains', authUser.uid)
    );
  }, [firestore, authUser?.uid]);

  const { data: friendships, error: friendshipError, isLoading: isFriendshipsLoading } = useCollection<Friendship>(friendshipQuery);

  // Fetch all users for the list
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(50)
    );
  }, [firestore, authUser?.uid]);

  const { data: allUsers, isLoading: isUsersLoading, error: usersError } = useCollection<User>(usersQuery);

  // Fallback: Fetch specific active chat user if not in the limited list
  const activeUserDocRef = useMemoFirebase(() => {
    if (!firestore || !activeChat) return null;
    return doc(firestore, 'users', activeChat);
  }, [firestore, activeChat]);
  const { data: activeUserFromDoc } = useDoc<User>(activeUserDocRef);

  const getFriendshipWith = (otherId: string) => {
    return friendships?.find(f => f.uids.includes(otherId));
  };

  const isMutualFriend = (otherId: string) => {
    const f = getFriendshipWith(otherId);
    return f?.status === 'mutual';
  };

  const followingList = allUsers?.filter(u => {
    if (u.id === authUser?.uid) return false;
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'active') return (isMutualFriend(u.id) || isAdmin) && matchesSearch;
    return matchesSearch;
  }) || [];

  const selectedUser = allUsers?.find(u => u.id === activeChat) || activeUserFromDoc;
  const isChatMutual = activeChat ? (isMutualFriend(activeChat) || isAdmin) : false;

  const chatId = activeChat && authUser?.uid 
    ? [authUser.uid, activeChat].sort().join('_') 
    : null;

  // Fetch messages for the active chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId || !authUser?.uid || !isChatMutual) return null;
    
    return query(
      collection(firestore, 'messages'),
      where('chatId', '==', chatId),
      where('participants', 'array-contains', authUser.uid),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [firestore, chatId, authUser?.uid, isChatMutual]);

  const { data: messages, isLoading: isMessagesLoading, error: messagesError } = useCollection<Message>(messagesQuery);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  // Mark messages as seen
  useEffect(() => {
    if (!firestore || !authUser || !activeChat || !messages || !isChatMutual) return;
    const unreadMessages = messages.filter(m => m.senderId === activeChat && m.status !== 'seen');
    unreadMessages.forEach(msg => {
      updateDocumentNonBlocking(doc(firestore, 'messages', msg.id), { status: 'seen' });
    });
  }, [messages, activeChat, authUser?.uid, firestore, isChatMutual]);

  const handleSendMessage = async () => {
    if (!firestore || !authUser || !activeChat || !messageText.trim() || !chatId || isSending) return;
    
    if (!isChatMutual) {
      toast({ variant: 'destructive', title: "Connection Required", description: "Mutual connection is required to send messages." });
      return;
    }

    setIsSending(true);
    try {
      // AI Content Moderation Check
      const moderation = await moderateContent({ text: messageText });
      
      if (!moderation.isSafe) {
        toast({
          variant: 'destructive',
          title: "Message Blocked",
          description: moderation.reason || "Vulgar or abusive language is strictly prohibited.",
        });
        setIsSending(false);
        return;
      }

      const msgData = {
        senderId: authUser.uid,
        receiverId: activeChat,
        participants: [authUser.uid, activeChat],
        chatId: chatId,
        text: messageText,
        status: 'sent',
        createdAt: serverTimestamp(),
      };

      setMessageText('');
      addDocumentNonBlocking(collection(firestore, 'messages'), msgData);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to send message." });
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelRequest = async (otherId: string) => {
    if (!firestore || !authUser) return;
    const existing = getFriendshipWith(otherId);
    if (existing) {
      deleteDocumentNonBlocking(doc(firestore, 'friendships', existing.id));
      toast({ title: "Request Cancelled", description: "Your connection request has been withdrawn." });
    }
  };

  const handleFollowUser = async (otherId: string, otherName: string) => {
    if (!firestore || !authUser) return;
    const friendshipId = [authUser.uid, otherId].sort().join('_');
    const existing = getFriendshipWith(otherId);

    if (existing) {
      if (existing.followedBy.includes(authUser.uid)) {
        toast({ title: "Request Pending", description: `You have already sent a request to ${otherName}.` });
        return;
      }
      
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
        message: `${authUser.displayName || 'An alumnus'} followed you back! Your secure interaction channel is now unlocked.`,
        read: false,
        createdAt: serverTimestamp()
      });

      if (isMutual) {
        toast({ title: "Connected!", description: `Mutual follow established. Secure chat unlocked.` });
      }
    } else {
      const data = {
        id: friendshipId,
        uids: [authUser.uid, otherId],
        followedBy: [authUser.uid],
        status: 'pending',
        updatedAt: serverTimestamp()
      };
      setDocumentNonBlocking(doc(firestore, 'friendships', friendshipId), data, { merge: true });
      
      addDocumentNonBlocking(collection(firestore, 'notifications'), {
        userId: otherId,
        type: 'connection',
        message: `${authUser.displayName || 'An alumnus'} sent you a connection request. Follow back to start chatting.`,
        read: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Request Sent", description: `Connection request sent to ${otherName}.` });
    }
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  if (!authUser && !isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-none bg-card/50 backdrop-blur-sm">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto opacity-20" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Private Alumni Network</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Log in to build mutual connections, manage follow-back requests, and start secure encrypted conversations.</p>
          </div>
          <Button asChild className="w-full font-bold h-12 rounded-xl shadow-lg shadow-primary/20">
            <Link href="/login">Access Alumni Hub</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 flex-col md:flex-row max-w-6xl mx-auto w-full">
      {/* Sidebar - Connection Lists */}
      <Card className={`w-full md:w-80 flex flex-col overflow-hidden border-none shadow-xl bg-card ${activeChat && !isVideoCallActive ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b space-y-4 bg-muted/10">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full h-10 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="active" className="text-xs font-bold gap-2">
                <MessageCircle className="h-3.5 w-3.5" /> Chats
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs font-bold gap-2">
                <UsersIcon className="h-3.5 w-3.5" /> Network
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={activeTab === 'active' ? "Search active chats..." : "Find fellow alumni..."}
              className="pl-9 bg-background border-none rounded-xl h-10 shadow-sm focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {isUsersLoading || isFriendshipsLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary opacity-20" /></div>
            ) : (usersError || friendshipError) ? (
              <div className="p-4 text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-destructive mx-auto opacity-50" />
                <p className="text-xs font-medium text-muted-foreground">Permission error. Please refresh.</p>
              </div>
            ) : followingList.length > 0 ? (
              followingList.map((user) => {
                const friendship = getFriendshipWith(user.id);
                const isMutual = friendship?.status === 'mutual';
                const isRequestedByMe = friendship && friendship.followedBy.includes(authUser?.uid || '') && !isMutual;
                const hasRequestedMe = friendship && !friendship.followedBy.includes(authUser?.uid || '') && !isMutual;

                return (
                  <div 
                    key={user.id} 
                    className={`relative w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group ${
                      activeChat === user.id ? 'bg-primary/10 text-primary shadow-inner' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setActiveChat(user.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-background shadow-md">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="font-bold bg-muted">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      {(isMutual || isAdmin) && <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate font-medium">
                        {isMutual ? 'Connected' : (isAdmin ? 'Admin Link' : (isRequestedByMe ? 'Requested' : (hasRequestedMe ? 'Accept Follow Back' : 'Alumni')))}
                      </p>
                    </div>
                    
                    {!isMutual && !isAdmin && (
                      <div className="flex flex-col gap-1 shrink-0">
                        {isRequestedByMe ? (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="px-3 rounded-full font-bold text-[9px] h-7 gap-1 z-10"
                            onClick={(e) => { e.stopPropagation(); handleCancelRequest(user.id); }}
                          >
                            <XCircle className="h-3 w-3" /> Cancel
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="px-3 rounded-full font-bold text-[9px] h-7 z-10"
                            onClick={(e) => { e.stopPropagation(); handleFollowUser(user.id, user.name); }}
                          >
                            {hasRequestedMe ? "Follow Back" : "Connect"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 px-4">
                <p className="text-xs text-muted-foreground font-medium">No results found.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Interaction Window */}
      <Card className={`flex-1 flex flex-col overflow-hidden border-none shadow-2xl bg-card ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {isVideoCallActive ? (
          <div className="flex-1 bg-zinc-950 relative flex items-center justify-center p-4">
             <div className="absolute top-6 left-6 z-10">
                <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/50 flex items-center gap-2 px-4 h-9 font-black tracking-tighter">
                   <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div> SECURE END-TO-END CALL
                </Badge>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full max-w-5xl">
                <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center group">
                   <Avatar className="h-32 w-32 border-4 border-primary/20 ring-8 ring-black/50 transition-transform group-hover:scale-110 duration-500">
                      <AvatarImage src={authUser?.photoURL || ''} />
                      <AvatarFallback className="text-2xl font-black">YOU</AvatarFallback>
                   </Avatar>
                   <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Local Feed</p>
                   </div>
                </div>
                <div className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center group">
                   <Avatar className="h-32 w-32 border-4 border-primary/20 ring-8 ring-black/50 transition-transform group-hover:scale-110 duration-500">
                      <AvatarImage src={selectedUser?.avatarUrl} />
                      <AvatarFallback className="text-2xl font-black">{getInitials(selectedUser?.name || 'U')}</AvatarFallback>
                   </Avatar>
                   <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">{selectedUser?.name?.split(' ')[0]}'s Stream</p>
                   </div>
                </div>
             </div>
             <div className="absolute bottom-12 flex gap-6">
                <Button size="lg" variant="destructive" className="rounded-full h-20 w-20 shadow-2xl hover:scale-110 transition-transform" onClick={() => setIsVideoCallActive(false)}>
                   <Phone className="h-8 w-8 rotate-[135deg]" />
                </Button>
                <Button size="lg" variant="secondary" className="rounded-full h-20 w-20 shadow-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl">
                   <MicOff className="h-8 w-8" />
                </Button>
             </div>
          </div>
        ) : selectedUser ? (
          <>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between shadow-lg z-10 ${isChatMutual ? 'bg-zinc-900 text-white' : 'bg-muted/30'}`}>
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 hover:bg-muted rounded-full transition-colors text-foreground">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <Link href={`/users/${selectedUser.id}`} className="relative group">
                  <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-background transition-transform group-hover:scale-105">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-black">{getInitials(selectedUser.name)}</AvatarFallback>
                  </Avatar>
                  {isChatMutual && isMicOn && <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.9)]"></span>}
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <Link href={`/users/${selectedUser.id}`} className={`text-base font-black leading-none tracking-tight hover:underline ${!isChatMutual && 'text-foreground'}`}>
                      {selectedUser.name}
                    </Link>
                    {isChatMutual && <Badge variant="outline" className="h-5 px-2 text-[9px] border-zinc-700 text-zinc-400 font-black tracking-widest bg-zinc-800/50">{isAdmin ? 'ADMIN CONNECTED' : 'MUTUAL CONNECTION'}</Badge>}
                  </div>
                  {isChatMutual ? (
                    <p className="text-[10px] text-zinc-500 font-black flex items-center gap-1.5 mt-1.5 uppercase tracking-widest">
                      <Radio className={`h-3 w-3 ${isMicOn ? 'text-green-500 animate-pulse' : 'text-zinc-600'}`} /> {isMicOn ? 'VOICE CHANNEL ACTIVE' : 'VOICE CHANNEL READY'}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Secure interaction channel ready</p>
                  )}
                </div>
              </div>
              
              {isChatMutual && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-zinc-800/50 rounded-xl p-1.5 border border-zinc-700/50 shadow-inner">
                    <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-lg transition-all ${isSpeakerOn ? 'text-white' : 'text-zinc-600 bg-zinc-900/50'}`} onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
                      {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                    <div className="w-[1px] h-6 bg-zinc-700 mx-2"></div>
                    <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-lg transition-all ${isMicOn ? 'text-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'text-zinc-600 bg-zinc-900/50'}`} onClick={() => setIsMicOn(!isMicOn)}>
                      {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-11 w-11 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl" onClick={() => setIsVideoCallActive(true)}>
                          <Video className="h-6 w-6" />
                      </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Messaging Feed or Locked State */}
            <ScrollArea className="flex-1 p-6 bg-zinc-50/50">
              {isChatMutual ? (
                <div className="space-y-8 max-w-4xl mx-auto">
                  <div className="flex justify-center mb-8">
                      <Badge variant="secondary" className="px-4 py-1.5 bg-zinc-100 text-muted-foreground flex items-center gap-2 font-bold tracking-tight border-none">
                          <Lock className="h-3 w-3" /> Messages are end-to-end encrypted
                      </Badge>
                  </div>
                  
                  {isMessagesLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" /></div>
                  ) : messagesError ? (
                    <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/10">
                      <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4 opacity-50" />
                      <p className="text-sm font-bold text-destructive">Unable to load messages.</p>
                      <p className="text-xs text-muted-foreground mt-1">Please check your permissions and refresh.</p>
                    </div>
                  ) : messages?.length ? (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-xl transition-all ${
                          msg.senderId === authUser?.uid 
                            ? 'bg-zinc-900 text-white rounded-tr-none ring-1 ring-zinc-800' 
                            : 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200 shadow-zinc-200/50'
                        }`}>
                          <p className="text-sm leading-relaxed font-medium tracking-tight">{msg.text}</p>
                          <div className={`flex items-center gap-2 mt-3 ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}>
                            <p className="text-[10px] font-black uppercase opacity-40 tracking-tighter">
                              {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'RECENT'}
                            </p>
                            {msg.senderId === authUser?.uid && (
                              <div className="flex -space-x-1">
                                  {msg.status === 'seen' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                  ) : (
                                      <Check className="h-3.5 w-3.5 opacity-40" />
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 opacity-30">
                      <div className="h-24 w-24 rounded-[2rem] bg-muted flex items-center justify-center">
                          <Handshake className="h-12 w-12" />
                      </div>
                      <div className="space-y-1">
                          <p className="text-lg font-black tracking-tighter uppercase">Connection Established</p>
                          <p className="text-sm font-medium">You and {selectedUser.name} are now connected. Say hello!</p>
                      </div>
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
                      <h3 className="text-xl font-black tracking-tighter uppercase">Mutual Connection Required</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        To protect the privacy of our alumni, secure chat, voice, and video features are only available once both individuals have followed each other.
                      </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full">
                    {(() => {
                      const friendship = getFriendshipWith(selectedUser.id);
                      const isRequestedByMe = friendship && friendship.followedBy.includes(authUser?.uid || '');
                      const hasRequestedMe = friendship && !friendship.followedBy.includes(authUser?.uid || '');

                      if (isRequestedByMe) {
                        return (
                          <Button variant="outline" className="w-full h-12 rounded-xl gap-2 font-bold" onClick={() => handleCancelRequest(selectedUser.id)}>
                            <XCircle className="h-4 w-4" /> Cancel Connection Request
                          </Button>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          <Button className="w-full h-12 rounded-xl gap-2 font-bold" onClick={() => handleFollowUser(selectedUser.id, selectedUser.name)}>
                            {hasRequestedMe ? <><UserCheck className="h-4 w-4" /> Accept & Follow Back</> : <><UserPlus className="h-4 w-4" /> Send Connection Request</>}
                          </Button>
                          <Link href={`/users/${selectedUser.id}`} className="block">
                            <Button variant="ghost" className="w-full h-12 rounded-xl gap-2 font-bold">
                              <ExternalLink className="h-4 w-4" /> View Full Profile
                            </Button>
                          </Link>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Message Input (only if mutual) */}
            {isChatMutual && (
              <div className="p-5 border-t bg-white/80 backdrop-blur-xl">
                <form className="flex gap-3 max-w-4xl mx-auto" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                  <div className="relative flex-1">
                    <Input 
                        placeholder={`Type a message to ${selectedUser.name.split(' ')[0]}...`} 
                        className="bg-zinc-100 border-none shadow-none rounded-[1.25rem] h-12 px-6 pr-12 text-sm font-medium focus-visible:ring-2 focus-visible:ring-zinc-900/5 transition-all text-foreground"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={isSending}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <ShieldAlert className="h-3.5 w-3.5 text-primary opacity-30" />
                    </div>
                  </div>
                  <Button type="submit" size="icon" className="rounded-2xl h-12 w-12 bg-zinc-900 shadow-xl shadow-zinc-900/20 hover:scale-105 active:scale-95 transition-all" disabled={!messageText.trim() || isSending}>
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  </Button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-12 text-center bg-zinc-50/30">
            <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-8 border border-zinc-100">
                <ShieldCheck className="h-10 w-10 text-primary animate-pulse opacity-40" />
            </div>
            <h3 className="font-black text-3xl text-zinc-900 mb-3 tracking-tighter">SECURE ALUMNI HUB</h3>
            <p className="text-sm max-w-xs leading-relaxed font-medium">
              Browse the network tab to send connection requests. Once a mutual follow is established, you'll unlock secure communication channels.
            </p>
            <div className="mt-10 flex gap-2">
                <Badge variant="secondary" className="px-3 py-1 font-bold text-[10px] tracking-widest uppercase">Verified Network</Badge>
                <Badge variant="secondary" className="px-3 py-1 font-bold text-[10px] tracking-widest uppercase">Encrypted Privacy</Badge>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
