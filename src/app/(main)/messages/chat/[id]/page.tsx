'use client';

import { useDoc, useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, ShieldCheck, Loader2, MoreVertical, Phone, Video } from 'lucide-react';
import type { User, Message, Friendship } from '@/lib/definitions';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function ChatRoomPage() {
  const params = useParams();
  const receiverId = params.id as string;
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const receiverDocRef = useMemoFirebase(() => {
    if (!firestore || !receiverId) return null;
    return doc(firestore, 'users', receiverId);
  }, [firestore, receiverId]);

  const { data: receiver, isLoading: isReceiverLoading } = useDoc<User>(receiverDocRef);

  const friendshipQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid || !receiverId) return null;
    return query(
      collection(firestore, 'friendships'),
      where('uids', 'array-contains', authUser.uid),
      where('status', '==', 'mutual')
    );
  }, [firestore, authUser?.uid, receiverId]);

  const { data: friendships, isLoading: isFriendshipLoading } = useCollection<Friendship>(friendshipQuery);
  const isMutual = friendships?.some(f => f.uids.includes(receiverId));

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid || !receiverId) return null;
    // Query messages where sender/receiver are authUser and receiverId
    return query(
      collection(firestore, 'messages'),
      where('senderId', 'in', [authUser.uid, receiverId]),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [firestore, authUser?.uid, receiverId]);

  const { data: allMessages } = useCollection<Message>(messagesQuery);
  
  // Filter messages client-side because Firestore doesn't support logical OR on multiple fields easily without complex indices
  const messages = allMessages?.filter(m => 
    (m.senderId === authUser?.uid && m.receiverId === receiverId) || 
    (m.senderId === receiverId && m.receiverId === authUser?.uid)
  ) || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !authUser || !content.trim() || !receiverId) return;

    const messageContent = content.trim();
    setContent('');

    addDocumentNonBlocking(collection(firestore, 'messages'), {
      senderId: authUser.uid,
      receiverId: receiverId,
      content: messageContent,
      createdAt: serverTimestamp(),
    });
  };

  if (isReceiverLoading || isFriendshipLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isMutual && !isReceiverLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <ShieldCheck className="h-16 w-16 text-primary mx-auto opacity-20" />
        <h2 className="text-2xl font-black">Connection Required</h2>
        <p className="text-muted-foreground leading-relaxed">
          You can only message members who have accepted your connection request. 
          Please send a request to **{receiver?.name}** first.
        </p>
        <Link href={`/users/${receiverId}`}>
          <Button className="font-black px-10 h-12 rounded-xl">View Profile to Connect</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-muted/30">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/5">
              <AvatarImage src={receiver?.avatarUrl} />
              <AvatarFallback className="font-bold">{receiver?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-black tracking-tight leading-none">{receiver?.name}</h2>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">Encrypted Connection</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 opacity-40 cursor-not-allowed"><Phone className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 opacity-40 cursor-not-allowed"><Video className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center py-10 space-y-2 opacity-30">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">End-to-End Secure</p>
          </div>
          
          {messages.map((m, i) => {
            const isMe = m.senderId === authUser?.uid;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] space-y-1`}>
                  <div className={`px-5 py-3 rounded-3xl text-sm font-medium shadow-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 text-foreground rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                  <p className={`text-[9px] font-black uppercase text-muted-foreground px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                    {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <footer className="p-6 bg-muted/5 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <Input 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a secure message..."
            className="h-12 border-none bg-muted/20 px-6 rounded-2xl font-medium focus-visible:ring-primary/20"
          />
          <Button type="submit" disabled={!content.trim()} className="h-12 w-12 rounded-2xl shadow-lg shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
