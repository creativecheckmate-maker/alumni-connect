'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Phone, Video, Info, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, serverTimestamp, limit } from 'firebase/firestore';
import type { User, Message } from '@/lib/definitions';

export default function MessagesPage() {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch all users for the sidebar
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !authUser || isAuthLoading) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(100)
    );
  }, [firestore, authUser, isAuthLoading]);

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
    // CRITICAL: Prevent query if auth state is not settled or chatId is missing.
    // This prevents "Missing or insufficient permissions" during auth transitions.
    if (!firestore || !chatId || !authUser?.uid || isAuthLoading) return null;
    
    return query(
      collection(firestore, 'messages'),
      // Adding participants filter is MANDATORY for security rules authorization for individual users.
      where('participants', 'array-contains', authUser.uid),
      where('chatId', '==', chatId),
      // Temporarily removed orderBy to troubleshoot indexing issues causing permission errors
      limit(100)
    );
  }, [firestore, chatId, authUser?.uid, isAuthLoading]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection<Message>(messagesQuery);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  const handleSendMessage = async () => {
    if (!firestore || !authUser || !activeChat || !messageText.trim() || !chatId) return;

    const msgData = {
      senderId: authUser.uid,
      receiverId: activeChat,
      participants: [authUser.uid, activeChat],
      chatId: chatId,
      text: messageText,
      createdAt: serverTimestamp(),
    };

    setMessageText('');
    addDocumentNonBlocking(collection(firestore, 'messages'), msgData);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isAuthLoading) {
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
          <h2 className="text-xl font-bold font-headline mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search alumni..." 
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
                  <Avatar className="h-12 w-12 ring-2 ring-background ring-offset-2 shrink-0 shadow-sm">
                    <AvatarImage src={user.avatarUrl} alt={user.name || 'User'} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-bold">{getInitials(user.name || 'U')}</AvatarFallback>
                  </Avatar>
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
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 hover:bg-muted rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar className="h-10 w-10 ring-2 ring-primary/20 shadow-sm">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">{getInitials(selectedUser.name || 'U')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold leading-none mb-1">{selectedUser.name || 'Nexus Alumnus'}</p>
                  <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Available Now
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-muted/5">
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
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-background text-foreground rounded-tl-none border border-muted'
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest opacity-70 ${msg.senderId === authUser?.uid ? 'text-right' : 'text-left'}`}>
                          {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <MessageCircle className="h-12 w-12 mb-2" />
                    <p className="text-sm font-bold">No messages yet</p>
                    <p className="text-xs">Start the conversation with {(selectedUser.name || 'this user').split(' ')[0]}</p>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input 
                  placeholder="Write a message..." 
                  className="bg-muted/20 border-none shadow-none focus-visible:ring-primary/20 rounded-xl h-11"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="shrink-0 rounded-xl h-11 w-11 shadow-lg transition-transform active:scale-95" 
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
                <MessageCircle className="h-12 w-12 text-primary/40" />
            </div>
            <h3 className="font-bold text-2xl text-foreground font-headline mb-2">Nexus Messenger</h3>
            <p className="text-sm max-w-xs leading-relaxed">
              Select an alumnus from the sidebar to start a secure, real-time conversation with your network.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}