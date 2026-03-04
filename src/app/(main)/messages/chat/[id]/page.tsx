'use client';

import { useDoc, useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, serverTimestamp, limit, onSnapshot, getDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, ShieldCheck, Loader2, MoreVertical, Phone, Check, CheckCheck, Mic, MicOff, PhoneOff, Volume2, Radio, Zap } from 'lucide-react';
import type { User, Message, Friendship } from '@/lib/definitions';
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

/**
 * Custom hook for real-time audio volume analysis.
 * Features a visual volume bar and speaking indicator (PUBG style).
 */
function useStreamVolume(stream: MediaStream | null) {
  const [volume, setVolume] = useState(0);
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setVolume(0);
      setIsTalking(false);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrame: number;

    const setup = async () => {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaStreamSource(stream);
        analyser.fftSize = 256;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / bufferLength;
          setVolume(average);
          setIsTalking(average > 25);
          animationFrame = requestAnimationFrame(update);
        };
        update();
      } catch (e) {
        console.warn("Audio analysis failed:", e);
      }
    };

    setup();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      if (audioContext) audioContext.close();
    };
  }, [stream]);

  return { volume, isTalking };
}

export default function ChatRoomPage() {
  const params = useParams();
  const receiverId = params.id as string;
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice Chat States
  const [isCalling, setIsCalling] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const localAudio = useStreamVolume(localStream);
  const remoteAudio = useStreamVolume(remoteStream);

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
    if (!firestore || !chatId || !authUser) return;

    const callDoc = doc(firestore, 'calls', chatId);
    const unsubscribe = onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (data?.offer && !pc && !isCalling && !isIncomingCall) {
        if (data.callerId !== authUser.uid) {
          setIsIncomingCall(true);
        }
      }
      if (!data && (pc || isCalling)) {
        endCall();
      }
    });

    return () => unsubscribe();
  }, [firestore, chatId, pc, isCalling, isIncomingCall, authUser]);

  const setupWebRTC = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const localPc = new RTCPeerConnection(servers);
      const remoteStreamObj = new MediaStream();

      stream.getTracks().forEach((track) => {
        localPc.addTrack(track, stream);
      });

      localPc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remoteStreamObj.addTrack(track);
        });
      };

      setLocalStream(stream);
      setRemoteStream(remoteStreamObj);
      setPc(localPc);

      return { localPc, stream };
    } catch (e) {
      toast({ variant: 'destructive', title: "Mic Error", description: "Microphone access is required for voice chat." });
      throw e;
    }
  };

  const startCall = async () => {
    if (!firestore || !chatId || !authUser) return;
    setIsCalling(true);
    try {
      const { localPc } = await setupWebRTC();

      const callDoc = doc(firestore, 'calls', chatId);
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      localPc.onicecandidate = (event) => {
        if (event.candidate) {
          addDocumentNonBlocking(offerCandidates, event.candidate.toJSON());
        }
      };

      const offerDescription = await localPc.createOffer();
      await localPc.setLocalDescription(offerDescription);

      await setDocumentNonBlocking(callDoc, { 
        offer: { sdp: offerDescription.sdp, type: offerDescription.type }, 
        callerId: authUser.uid,
        status: 'calling',
        createdAt: serverTimestamp() 
      }, { merge: true });

      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (!localPc.currentRemoteDescription && data?.answer) {
          localPc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      onSnapshot(answerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            localPc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    } catch (e) {
      setIsCalling(false);
    }
  };

  const answerCall = async () => {
    if (!firestore || !chatId) return;
    setIsIncomingCall(false);
    setIsCalling(true);
    try {
      const { localPc } = await setupWebRTC();

      const callDoc = doc(firestore, 'calls', chatId);
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      localPc.onicecandidate = (event) => {
        if (event.candidate) {
          addDocumentNonBlocking(answerCandidates, event.candidate.toJSON());
        }
      };

      const callData = (await getDoc(callDoc)).data();
      if (!callData?.offer) throw new Error("Missing offer");

      await localPc.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answerDescription = await localPc.createAnswer();
      await localPc.setLocalDescription(answerDescription);

      await updateDocumentNonBlocking(callDoc, { 
        answer: { type: answerDescription.type, sdp: answerDescription.sdp }, 
        status: 'connected' 
      });

      onSnapshot(offerCandidates, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            localPc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    } catch (e) {
      setIsCalling(false);
    }
  };

  const endCall = () => {
    if (pc) {
      pc.close();
      setPc(null);
    }
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCalling(false);
    setIsIncomingCall(false);
    if (firestore && chatId) {
      deleteDocumentNonBlocking(doc(firestore, 'calls', chatId));
    }
  };

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
        <h2 className="text-2xl font-black">Authorized Only</h2>
        <p className="text-muted-foreground leading-relaxed">
          Start a mutual connection to unlock real-time messaging and live voice channels.
        </p>
        <Link href={`/users/${receiverId}`}>
          <Button className="font-black px-10 h-12 rounded-xl">View Member Profile</Button>
        </Link>
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
              {isOnline && !isCalling && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></span>
              )}
              {remoteAudio.isTalking && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 animate-bounce shadow-lg ring-2 ring-white">
                  <Volume2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-tight leading-none truncate">{receiver?.name}</h2>
                {isCalling && (
                  <Badge className="h-4 px-1.5 text-[8px] bg-red-500 animate-pulse border-none">LIVE</Badge>
                )}
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
        
        <div className="flex items-center gap-4">
          {isCalling && (
            <div className="hidden md:flex flex-col items-center gap-1 w-24">
               <div className="flex items-center justify-between w-full text-[8px] font-black uppercase text-muted-foreground">
                  <span>HUD</span>
                  <span>Team Audio</span>
               </div>
               <Progress value={remoteAudio.volume * 2} className="h-1 bg-muted rounded-full" />
            </div>
          )}

          <div className="flex items-center gap-1">
            {isCalling ? (
              <Button variant="destructive" size="icon" className="rounded-full h-10 w-10 animate-pulse" onClick={endCall}>
                <PhoneOff className="h-5 w-5" />
              </Button>
            ) : isIncomingCall ? (
              <div className="flex gap-2 bg-green-500/10 p-1 rounded-full border border-green-500/20">
                <Button variant="default" size="sm" className="rounded-full bg-green-600 hover:bg-green-700 animate-bounce h-8 text-[10px] font-bold" onClick={answerCall}>
                  Join Voice
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-destructive" onClick={endCall}>
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-full h-9 w-9 transition-all ${isOnline ? 'bg-primary/5 text-primary hover:bg-primary/10 hover:scale-110' : 'opacity-40 cursor-not-allowed'}`} 
                onClick={() => isOnline && startCall()}
                disabled={!isOnline}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex flex-col items-center py-10 space-y-3 opacity-20">
            <div className="relative">
               <Radio className="h-12 w-12 text-primary animate-pulse" />
               <Zap className="absolute -top-1 -right-1 h-4 w-4 text-primary fill-current" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Communication HUD Active</p>
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
              {localAudio.isTalking && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <div className="h-1.5 w-1 bg-primary animate-[bounce_0.5s_infinite]" />
                   <div className="h-3 w-1 bg-primary animate-[bounce_0.7s_infinite]" />
                   <div className="h-1.5 w-1 bg-primary animate-[bounce_0.5s_infinite]" />
                </div>
              )}
          </div>
          <Button type="submit" disabled={!content.trim()} className="h-12 w-12 rounded-2xl shadow-lg shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>

      <audio ref={(audio) => { if (audio && remoteStream) audio.srcObject = remoteStream; }} autoPlay />
    </div>
  );
}
