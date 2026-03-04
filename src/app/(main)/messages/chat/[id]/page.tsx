'use client';

import { useDoc, useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, ShieldCheck, Loader2, MoreVertical, Phone, Video, Check, CheckCheck } from 'lucide-react';
import type { User, Message, Friendship } from '@/lib/definitions';
import { useState, useRef, useEffect, useMemo } from 'react';
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

  // Generate a stable chatId for the conversation
  const chatId = useMemo(() => {
    if (!authUser?.uid || !receiverId) return null;
    return [authUser.uid, receiverId].sort().join('_');
  }, [authUser?.uid, receiverId]);

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

  // Mark as read logic
  useEffect(() => {
    if (!firestore || !authUser?.uid || !messages || messages.length === 0) return;

    const unreadMessages = messages.filter(
      m => m.receiverId === authUser.uid && m.status !== 'read'
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(m => {
        updateDocumentNonBlocking(doc(firestore, 'messages', m.id), {
          status: 'read'
        });
      });
    }
  }, [messages, authUser?.uid, firestore]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !authUser || !content.trim() || !receiverId || !chatId) return;

    const messageContent = content.trim();
    setContent('');

    addDocumentNonBlocking(collection(firestore, 'messages'), {
      chatId: chatId,
      senderId: authUser.uid,
      receiverId: receiverId,
      content: messageContent,
      status: 'sent',
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
      <header className="px-6 py-4 border-b bg-muted/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/5">
              <AvatarImage src={receiver?.avatarUrl} />
              <AvatarFallback className="font-bold">{receiver?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight leading-none truncate">{receiver?.name}</h2>
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
      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center py-10 space-y-2 opacity-30">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">End-to-End Secure</p>
          </div>
          
          {messages?.map((m) => {
            const isMe = m.senderId === authUser?.uid;
            const status = m.status || 'sent';
            
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] space-y-1`}>
                  <div className={`px-5 py-3 rounded-3xl text-sm font-medium shadow-sm transition-all ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-muted/50 text-foreground rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-[9px] font-black uppercase text-muted-foreground">
                      {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                    </p>
                    {isMe && (
                      <div className="flex items-center">
                        {status === 'read' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                        ) : status === 'delivered' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <footer className="p-4 md:p-6 bg-muted/5 border-t shrink-0">
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