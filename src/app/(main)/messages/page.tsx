
'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Phone, Video, Info, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import type { User, Message } from '@/lib/definitions';

export default function MessagesPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch real users from Firestore
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(50));
  }, [firestore]);

  const { data: allUsers } = useCollection<User>(usersQuery);
  const users = allUsers?.filter(u => u.id !== authUser?.uid) || [];

  const selectedUser = users.find(u => u.id === activeChat);

  // Determine chat ID (deterministic sorting of UIDs)
  const chatId = activeChat && authUser?.uid 
    ? [authUser.uid, activeChat].sort().join('_') 
    : null;

  // Fetch real-time messages for the active chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [firestore, chatId]);

  const { data: messages } = useCollection<Message>(messagesQuery);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!firestore || !authUser || !activeChat || !messageText.trim() || !chatId) return;

    const msgData = {
      senderId: authUser.uid,
      receiverId: activeChat,
      chatId: chatId,
      text: messageText,
      createdAt: serverTimestamp(),
    };

    setMessageText('');
    await addDoc(collection(firestore, 'messages'), msgData);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 flex-col md:flex-row">
      {/* Sidebar: User List */}
      <Card className="w-full md:w-80 flex flex-col overflow-hidden border-none shadow-md">
        <div className="p-4 border-b bg-card">
          <h2 className="text-lg font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search alumni..." className="pl-8 bg-muted/20 border-none shadow-none" />
          </div>
        </div>
        <ScrollArea className="flex-1 bg-card">
          <div className="p-2 space-y-1">
            {users.length > 0 ? (
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
                  <Avatar className="h-10 w-10 ring-2 ring-background ring-offset-2">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.college}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">No users found.</div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Window */}
      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-md min-h-[400px]">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{selectedUser.name}</p>
                  <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Available
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-muted/5">
              <div className="space-y-6">
                {messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                        msg.senderId === authUser?.uid
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-card text-card-foreground rounded-tl-none border'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-[9px] mt-2 font-medium opacity-70 ${msg.senderId === authUser?.uid ? 'text-right' : 'text-left'}`}>
                        {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <form 
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <Input 
                  placeholder="Type your message..." 
                  className="bg-muted/20 border-none shadow-none focus-visible:ring-primary/20"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button type="submit" size="icon" className="shrink-0 rounded-full h-10 w-10 shadow-lg">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Send className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Nexus Messenger</h3>
            <p className="text-sm max-w-xs">Select an alumnus from the sidebar to start a real-time conversation.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
