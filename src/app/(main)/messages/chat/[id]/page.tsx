
'use client';

import React from 'react';
import { useDoc, useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, limit, onSnapshot, getDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, Check, CheckCheck, Radio, Zap, Mic, MicOff, Phone, PhoneOff, Shield } from 'lucide-react';
import type { User, Message } from '@/lib/definitions';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export default function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: receiverId } = React.use(params);
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice Chat State
  const [isCommsActive, setIsCommsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const receiverDocRef = useMemoFirebase(() => {
    if (!firestore || !receiverId) return null;
    return doc(firestore, 'users', receiverId);
  }, [firestore, receiverId]);

  const { data: receiver, isLoading: isReceiverLoading } = useDoc<User>(receiverDocRef);

  const chatId = useMemo(() => {
    if (!authUser?.uid || !receiverId) return null;
    return [authUser.uid, receiverId].sort().join('_');
  }, [authUser?.uid, receiverId]);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'messages'),
      where('chatId', '==', chatId),
      limit(100)
    );
  }, [firestore, chatId]);

  const { data: rawMessages } = useCollection<Message>(messagesQuery);

  const messages = useMemo(() => {
    if (!rawMessages) return [];
    return [...rawMessages].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeA - timeB;
    });
  }, [rawMessages]);

  useEffect(() => {
    if (!firestore || !authUser?.uid || !messages || messages.length === 0) return;
    const unreadMessages = messages.filter(m => m.receiverId === authUser.uid && m.status !== 'read');
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(m => {
        updateDocumentNonBlocking(doc(firestore, 'messages', m.id), { status: 'read' });
      });
    }
  }, [messages, authUser?.uid, firestore]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
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

  // WebRTC Logic
  const setupVoiceComms = async (mode: 'offer' | 'answer') => {
    if (!firestore || !chatId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setLocalStream(stream);
      setIsCommsActive(true);

      const peerConnection = new RTCPeerConnection(servers);
      pc.current = peerConnection;

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const remoteStream = new MediaStream();
      peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
      };

      const callDoc = doc(firestore, 'calls', chatId);
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          const targetCol = mode === 'offer' ? offerCandidates : answerCandidates;
          addDoc(targetCol, event.candidate.toJSON());
        }
      };

      if (mode === 'offer') {
        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        };

        await setDocumentNonBlocking(callDoc, { offer }, { merge: true });

        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (!peerConnection.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            peerConnection.setRemoteDescription(answerDescription);
          }
        });

        onSnapshot(answerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              peerConnection.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        });
      } else {
        const callSnapshot = await getDoc(callDoc);
        const callData = callSnapshot.data();

        if (callData?.offer) {
          const offerDescription = new RTCSessionDescription(callData.offer);
          await peerConnection.setRemoteDescription(offerDescription);

          const answerDescription = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answerDescription);

          const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          };

          await updateDocumentNonBlocking(callDoc, { answer });

          onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                peerConnection.addIceCandidate(new RTCIceCandidate(data));
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Comms error:', error);
      toast({ variant: 'destructive', title: 'Comms Failed', description: 'Could not establish tactical link.' });
      endComms();
    }
  };

  const endComms = async () => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setIsCommsActive(false);
    setIsMuted(false);
    
    if (firestore && chatId) {
      try {
        await deleteDoc(doc(firestore, 'calls', chatId));
      } catch (e) {}
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return () => {
      endComms();
    };
  }, []);

  if (isReceiverLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOnline = !!receiver?.isOnline;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-muted/30">
      <header className="px-6 py-4 border-b bg-muted/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className={`h-10 w-10 ring-2 ${isOnline ? 'ring-green-500/20' : 'ring-primary/5'}`}>
                <AvatarImage src={receiver?.avatarUrl} />
                <AvatarFallback className="font-bold">{receiver?.name?.[0]}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight leading-none truncate">{receiver?.name}</h2>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground opacity-40'}`}></span>
                <p className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 transition-all ${isCommsActive ? 'animate-pulse' : 'opacity-20'}`}>
                <Radio className={`h-4 w-4 ${isCommsActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {isCommsActive ? 'SQUAD COMMS ACTIVE' : 'SQUAD COMMS READY'}
                </span>
             </div>
        </div>

        <div className="flex items-center gap-2">
          {isCommsActive ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
              <Button 
                variant="outline" 
                size="icon" 
                className={`rounded-full h-9 w-9 ${isMuted ? 'bg-destructive/10 text-destructive border-destructive/20' : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="rounded-full h-9 w-9 shadow-lg shadow-destructive/20"
                onClick={endComms}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                className="h-9 gap-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm"
                onClick={() => setupVoiceComms('offer')}
              >
                <Zap className="h-3 w-3 fill-current" /> Commence Comms
              </Button>
              <Button 
                variant="outline" 
                className="h-9 gap-2 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest"
                onClick={() => setupVoiceComms('answer')}
              >
                <Phone className="h-3 w-3" /> Join
              </Button>
            </div>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 md:p-6">
        <audio ref={remoteAudioRef} autoPlay />
        <div className="space-y-6">
          <div className="flex flex-col items-center py-10 space-y-3 opacity-20">
            <div className="relative">
               <Radio className="h-12 w-12 text-primary animate-pulse" />
               <Zap className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-current" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Communication HUD Ready</p>
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
                      {m.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'JUST NOW'}
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

      <footer className="p-4 md:p-6 bg-muted/5 border-t shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="relative flex-1">
             <Input 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type a message..."
                className="h-12 border-none bg-muted/20 px-6 rounded-2xl font-medium focus-visible:ring-primary/20"
              />
          </div>
          <Button type="submit" disabled={!content.trim()} className="h-12 w-12 rounded-2xl shadow-lg shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
