
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
  Info, 
  Loader2, 
  ArrowLeft, 
  MessageCircle,
  Radio,
  Check,
  CheckCheck,
  UserPlus,
  UserCheck,
  Video,
  Phone,
  PhoneCall
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { 
  useUser, 
  useFirestore, 
  useMemoFirebase, 
  useCollection, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  setDocumentNonBlocking
} from '@/firebase';
import { collection, query, where, serverTimestamp, limit, doc, orderBy } from 'firebase/firestore';
import type { User, Message, Friendship } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

export default function MessagesPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'network'>('active');
  
  // PUBG Voice Chat State
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Video Call State
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all friendships for the current user
  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser || isUserLoading) return null;
    return query(
      collection(firestore, 'friendships'),
      where('uids', 'array-contains', authUser.uid)
    );
  }, [firestore, authUser, isUserLoading]);

  const { data: friendships } = useCollection<Friendship>(friendshipQuery);

  // Fetch all users for the Network tab
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser || isUserLoading) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(100)
    );
  }, [firestore, authUser, isUserLoading]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  // Filter users based on friendship status for "Active" vs "Network"
  const getFriendshipWith = (otherId: string) => {
    return friendships?.find(f => f.uids.includes(otherId));
  };

  const isMutualFriend = (otherId: string) => {
    const f = getFriendshipWith(otherId);
    return f?.status === 'mutual';
  };

  const followingList = allUsers?.filter(u => {
    if (u.id === authUser?.uid) return false;
    if (activeTab === 'active') return isMutualFriend(u.id);
    return (u.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const selectedUser = allUsers?.find(u => u.id === activeChat);

  const chatId = activeChat && authUser?.uid 
    ? [authUser.uid, activeChat].sort().join('_') 
    : null;

  // Fetch messages for the active chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId || !authUser?.uid || isUserLoading) return null;
    
    return query(
      collection(firestore, 'messages'),
      where('chatId', '==', chatId),
      where('participants', 'array-contains', authUser.uid),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [firestore, chatId, authUser?.uid, isUserLoading]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection<Message>(messagesQuery);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  // Mark messages as seen
  useEffect(() => {
    if (!firestore || !authUser || !activeChat || !messages) return;
    const unreadMessages = messages.filter(m => m.senderId === activeChat && m.status !== 'seen');
    unreadMessages.forEach(msg => {
      updateDocumentNonBlocking(doc(firestore, 'messages', msg.id), { status: 'seen' });
    });
  }, [messages, activeChat, authUser?.uid, firestore]);

  const handleSendMessage = async () => {
    if (!firestore || !authUser || !activeChat || !messageText.trim() || !chatId) return;
    if (!isMutualFriend(activeChat)) {
      toast({ variant: 'destructive', title: "Chat Restricted", description: "You must both follow each other to chat." });
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
  };

  const handleFollowUser = async (otherId: string) => {
    if (!firestore || !authUser) return;
    const friendshipId = [authUser.uid, otherId].sort().join('_');
    const existing = getFriendshipWith(otherId);

    if (existing) {
      if (existing.followedBy.includes(authUser.uid)) {
        toast({ title: "Already Following", description: "You are already following this alumnus." });
        return;
      }
      // Follow back!
      const newFollowedBy = [...existing.followedBy, authUser.uid];
      const newStatus = newFollowedBy.length === 2 ? 'mutual' : 'pending';
      updateDocumentNonBlocking(doc(firestore, 'friendships', existing.id), {
        followedBy: newFollowedBy,
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      if (newStatus === 'mutual') toast({ title: "Connected!", description: "You can now chat with this alumnus." });
    } else {
      // New friendship request
      const data: Friendship = {
        id: friendshipId,
        uids: [authUser.uid, otherId],
        followedBy: [authUser.uid],
        status: 'pending',
        updatedAt: serverTimestamp()
      } as any;
      setDocumentNonBlocking(doc(firestore, 'friendships', friendshipId), data, { merge: true });
      toast({ title: "Followed", description: "Request sent. Once they follow back, you can chat." });
    }
  };

  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  if (!authUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-lg border-none">
          <MessageCircle className="h-12 w-12 text-primary mx-auto opacity-20" />
          <h2 className="text-xl font-bold">Messaging is Private</h2>
          <p className="text-muted-foreground text-sm">Please log in to build your alumni network and start conversations.</p>
          <Button asChild className="w-full font-bold h-12 rounded-xl">
            <a href="/login">Log In to Messages</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 flex-col md:flex-row max-w-6xl mx-auto w-full">
      {/* Sidebar */}
      <Card className={`w-full md:w-80 flex flex-col overflow-hidden border-none shadow-md bg-card ${activeChat && !isVideoCallActive ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b space-y-4">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="active" className="text-xs font-bold">Chats</TabsTrigger>
              <TabsTrigger value="network" className="text-xs font-bold">Network</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={activeTab === 'active' ? "Search chats..." : "Find alumni..."}
              className="pl-9 bg-muted/20 border-none rounded-xl h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {followingList.map((user) => (
              <div key={user.id} className="group relative">
                <button
                  onClick={() => isMutualFriend(user.id) ? setActiveChat(user.id) : null}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    activeChat === user.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  } ${!isMutualFriend(user.id) && activeTab === 'active' ? 'opacity-50' : ''}`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-background shrink-0">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="font-bold">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    {isMutualFriend(user.id) && <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                      {isMutualFriend(user.id) ? 'Connected' : 'Alumni'}
                    </p>
                  </div>
                  {activeTab === 'network' && !isMutualFriend(user.id) && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
                      onClick={(e) => { e.stopPropagation(); handleFollowUser(user.id); }}
                    >
                      {getFriendshipWith(user.id)?.followedBy.includes(authUser.uid) ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </Button>
                  )}
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat / Video Window */}
      <Card className={`flex-1 flex flex-col overflow-hidden border-none shadow-md bg-card ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {isVideoCallActive ? (
          <div className="flex-1 bg-zinc-950 relative flex items-center justify-center p-4">
             <div className="absolute top-4 left-4 z-10">
                <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/50 flex items-center gap-2 px-3 h-8">
                   <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div> LIVE SECURE CALL
                </Badge>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full max-w-5xl">
                <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center">
                   <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={authUser.photoURL || ''} />
                      <AvatarFallback className="text-2xl">YOU</AvatarFallback>
                   </Avatar>
                   <p className="absolute bottom-4 left-4 text-xs font-bold text-white/50">Your Camera</p>
                </div>
                <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl flex items-center justify-center">
                   <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={selectedUser?.avatarUrl} />
                      <AvatarFallback className="text-2xl">{getInitials(selectedUser?.name || 'U')}</AvatarFallback>
                   </Avatar>
                   <p className="absolute bottom-4 left-4 text-xs font-bold text-white/50">{selectedUser?.name}'s Stream</p>
                </div>
             </div>
             <div className="absolute bottom-10 flex gap-4">
                <Button size="lg" variant="destructive" className="rounded-full h-16 w-16 shadow-xl" onClick={() => setIsVideoCallActive(false)}>
                   <Phone className="h-6 w-6 rotate-[135deg]" />
                </Button>
                <Button size="lg" variant="secondary" className="rounded-full h-16 w-16 shadow-xl bg-white/10 hover:bg-white/20 text-white">
                   <MicOff className="h-6 w-6" />
                </Button>
             </div>
          </div>
        ) : selectedUser ? (
          <>
            {/* PUBG Header */}
            <div className="p-4 border-b flex items-center justify-between bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 hover:bg-zinc-800 rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-zinc-700 shadow-sm">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{getInitials(selectedUser.name)}</AvatarFallback>
                  </Avatar>
                  {isMicOn && <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold leading-none">{selectedUser.name}</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-zinc-700 text-zinc-400 font-black tracking-widest bg-zinc-800">ALUMNI</Badge>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1 mt-1 uppercase">
                    <Radio className="h-3 w-3 text-green-500" /> Voice Channel Active
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-zinc-800 rounded-lg p-1 border border-zinc-700">
                  <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${isSpeakerOn ? 'text-white' : 'text-zinc-600'}`} onClick={() => setIsSpeakerOn(!isSpeakerOn)}>
                    {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <div className="w-[1px] h-4 bg-zinc-700 mx-1"></div>
                  <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-md ${isMicOn ? 'text-green-500 bg-green-500/10' : 'text-zinc-600'}`} onClick={() => setIsMicOn(!isMicOn)}>
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-green-400 hover:text-green-300" onClick={() => setIsVideoCallActive(true)}>
                   <Video className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-zinc-50/50">
              <div className="space-y-6">
                {isMessagesLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : messages?.length ? (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === authUser.uid ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${msg.senderId === authUser.uid ? 'bg-zinc-900 text-white rounded-tr-none' : 'bg-white text-zinc-900 rounded-tl-none border'}`}>
                        <p className="leading-relaxed font-medium">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-2 ${msg.senderId === authUser.uid ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-[9px] font-black uppercase opacity-50">{msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}</p>
                          {msg.senderId === authUser.uid && (
                            msg.status === 'seen' ? <CheckCheck className="h-3 w-3 text-blue-400" /> : <Check className="h-3 w-3 opacity-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <MessageCircle className="h-16 w-16 mb-4" />
                    <p className="text-sm font-bold">Encrypted Communication</p>
                    <p className="text-xs">Start a conversation with {selectedUser.name}</p>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <Input 
                  placeholder="Type secure message..." 
                  className="bg-zinc-100 border-none shadow-none rounded-xl h-11 pr-10"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button type="submit" size="icon" className="rounded-xl h-11 w-11 bg-zinc-900" disabled={!messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
            <Radio className="h-12 w-12 mb-6 animate-pulse opacity-20" />
            <h3 className="font-bold text-2xl text-foreground mb-2">Alumni Secure Hub</h3>
            <p className="text-sm max-w-xs leading-relaxed">
              Connect with fellow alumni. Follow each other to unlock voice, video, and text messaging channels.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
