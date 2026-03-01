
'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  CheckCheck
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, limit, doc, orderBy } from 'firebase/firestore';
import type { User, Message } from '@/lib/definitions';

export default function MessagesPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all users for the sidebar (excluding self)
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser || isUserLoading) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(100)
    );
  }, [firestore, authUser, isUserLoading]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const users = allUsers?.filter(u => 
    u.id !== authUser?.uid  && 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedUser = allUsers?.find(u => u.id === activeChat);

  const chatId = activeChat && authUser?.uid 
    ? [authUser.uid, activeChat].sort().join('_') 
    : null;

  // Fetch messages for the active chat
  const messagesQuery = useMemoFirebase(() => {
    // CRITICAL: Must filter by 'participants' array-contains to satisfy security rules for 'list'
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  // Mark messages as seen (WhatsApp Feedback Logic)
  useEffect(() => {
    if (!firestore || !authUser || !activeChat || !messages || messages.length === 0) return;

    // Only mark messages sent by the OTHER person as seen
    const unreadMessages = messages.filter(
      (msg) => msg.senderId === activeChat && msg.status !== 'seen'
    );

    unreadMessages.forEach((msg) => {
      const msgRef = doc(firestore, 'messages', msg.id);
      // Non-blocking update to avoid UI lag
      updateDocumentNonBlocking(msgRef, { status: 'seen' });
    });
  }, [messages, activeChat, authUser?.uid, firestore]);

  const handleSendMessage = async () => {
    if (!firestore || !authUser || !activeChat || !messageText.trim() || !chatId) return;

    const msgData = {
      senderId: authUser.uid,
      receiverId: activeChat,
      participants: [authUser.uid, activeChat],
      chatId: chatId,
      text: messageText,
      status: 'sent', // Initial status
      createdAt: serverTimestamp(),
    };

    setMessageText('');
    addDocumentNonBlocking(collection(firestore, 'messages'), msgData);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isUserLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-lg border-none bg-card">
          <MessageCircle className="h-12 w-12 text-primary mx-auto opacity-20" />
          <h2 className="text-xl font-bold font-headline">Messaging is Private</h2>
          <p className="text-muted-foreground text-sm">Please log in to start conversations with fellow alumni and mentors.</p>
          <Button asChild className="w-full font-bold h-12 rounded-xl">
            <a href="/login">Log In to Messages</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 flex-col md:flex-row max-w-6xl mx-auto w-full">
      {/* Contact List Sidebar */}
      <Card className={`w-full md:w-80 flex flex-col overflow-hidden border-none shadow-md bg-card ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold font-headline mb-4">Alumni Network</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Find friends..." 
              className="pl-9 bg-muted/20 border-none shadow-none rounded-xl h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isUsersLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setActiveChat(user.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    activeChat === user.id 
                      ? 'bg-primary/10 text-primary shadow-sm' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-background ring-offset-2 shrink-0 shadow-sm">
                      <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-bold">{getInitials(user.name || 'U')}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate">{user.name || 'Nexus Alumnus'}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">
                      {user.role === 'student' ? (user.major || 'Nexus Student') : (user.department || 'Nexus Staff')}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center space-y-2">
                <p className="text-sm font-bold text-muted-foreground">No alumni found</p>
                <p className="text-xs text-muted-foreground/60">Try a different search term.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Window */}
      <Card className={`flex-1 flex flex-col overflow-hidden border-none shadow-md min-h-[400px] bg-card ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* PUBG Style Header */}
            <div className="p-4 border-b flex items-center justify-between bg-zinc-900 text-white">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 hover:bg-zinc-800 rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-zinc-700 shadow-sm">
                    <AvatarImage src={selectedUser.avatarUrl} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{getInitials(selectedUser.name || 'U')}</AvatarFallback>
                  </Avatar>
                  {isMicOn && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold leading-none">{selectedUser.name || 'Player'}</p>
                    <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-zinc-700 text-zinc-400 font-black tracking-widest bg-zinc-800">TEAM</Badge>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold flex items-center gap-1 mt-1 uppercase tracking-tighter">
                    <Radio className="h-3 w-3 text-green-500" /> 
                    Voice Channel Active
                  </p>
                </div>
              </div>
              
              {/* Voice Controls (PUBG Style) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-zinc-800 rounded-lg p-1 border border-zinc-700">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-md transition-all ${isSpeakerOn ? 'text-white' : 'text-zinc-600'}`}
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  >
                    {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <div className="w-[1px] h-4 bg-zinc-700 mx-1"></div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-md transition-all ${isMicOn ? 'text-green-500 bg-green-500/10' : 'text-zinc-600'}`}
                    onClick={() => setIsMicOn(!isMicOn)}
                  >
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-white"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-zinc-50/50">
              <div className="space-y-6">
                {isMessagesLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div
                        className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm ${ 
                          msg.senderId === authUser?.uid
                            ? 'bg-zinc-900 text-white rounded-tr-none'
                            : 'bg-white text-zinc-900 rounded-tl-none border border-zinc-200'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-2 ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-50">
                            {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                          </p>
                          {msg.senderId === authUser?.uid && (
                            <div className="flex items-center">
                              {msg.status === 'seen' ? (
                                <CheckCheck className="h-3 w-3 text-blue-400" />
                              ) : (
                                <Check className="h-3 w-3 opacity-50" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <div className="h-16 w-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-zinc-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-900">Encrypted Communication</p>
                    <p className="text-xs text-zinc-500">Messages are private between you and {(selectedUser?.name || 'this user').split(' ')[0]}</p>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <div className="relative flex-1">
                  <Input 
                    placeholder="Enter message..." 
                    className="bg-zinc-100 border-none shadow-none focus-visible:ring-zinc-200 rounded-xl h-11 pr-10 font-medium"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-zinc-400">
                    <Radio className={`h-4 w-4 ${isMicOn ? 'text-green-500 animate-pulse' : ''}`} />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="shrink-0 rounded-xl h-11 w-11 bg-zinc-900 hover:bg-zinc-800 shadow-lg transition-transform active:scale-95" 
                  disabled={!messageText.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
            <div className="h-24 w-24 rounded-[2rem] bg-primary/5 flex items-center justify-center mb-6 shadow-sm">
                <Radio className="h-12 w-12 text-primary/40 animate-pulse" />
            </div>
            <h3 className="font-bold text-2xl text-foreground font-headline mb-2">Network Voice Chat</h3>
            <p className="text-sm max-w-xs leading-relaxed">
              Select an alumnus to join a private secure channel with real-time text and simulated voice status.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
