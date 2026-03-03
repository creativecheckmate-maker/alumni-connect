'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Send, MoreVertical, Trash2, X, Loader2, Rss, Scissors, ShieldAlert } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import type { FeedPost, User } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';
import Image from 'next/image';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import { moderateContent } from '@/ai/flows/moderation';

export default function FeedPage() {
  const { user, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL;

  const userProfileDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userProfile } = useDoc<User>(userProfileDocRef);

  const feedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feed'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts } = useCollection<FeedPost>(feedQuery);

  const handlePost = async () => {
    if (!firestore || !user || (!content.trim() && !imageUrl)) return;
    
    setIsPosting(true);
    try {
      // AI Content Moderation Check
      const moderation = await moderateContent({ text: content, imageUrl: imageUrl || undefined });
      
      if (!moderation.isSafe) {
        toast({
          variant: 'destructive',
          title: "Content Blocked",
          description: moderation.reason || "Your post violates our professional community standards.",
        });
        setIsPosting(false);
        return;
      }

      await addDoc(collection(firestore, 'feed'), {
        authorId: user.uid,
        authorName: userProfile?.name || user.displayName || 'Nexus Alumnus',
        authorAvatarUrl: userProfile?.avatarUrl || user.photoURL || '',
        content,
        imageUrl: imageUrl || null,
        likes: 0,
        createdAt: serverTimestamp(),
      });
      setContent('');
      setImageUrl(null);
      toast({ title: "Update Published", description: "Your memory has been shared with the network." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to publish post." });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'feed', id));
    toast({ title: "Post Deleted", description: "The update has been removed." });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Community Feed" description="Real-time updates and memories from the Nexus global network." />

      {user ? (
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                <AvatarImage src={userProfile?.avatarUrl || user?.photoURL || ''} />
                <AvatarFallback className="font-bold">{userProfile?.name?.[0] || user?.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-3 w-3 text-primary opacity-50" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">AI Moderated Feed</span>
                </div>
                <Textarea 
                    placeholder="Share a professional milestone or a campus memory..." 
                    className="min-h-[120px] border-none focus-visible:ring-0 bg-muted/20 resize-none p-5 text-base rounded-[1.5rem] font-medium placeholder:text-muted-foreground/50"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                {imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden group h-64 border-4 border-muted/30 shadow-inner">
                    <Image src={imageUrl} alt="Upload preview" fill className="object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-3 right-3 h-10 w-10 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                      onClick={() => setImageUrl(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-muted/50 pt-4 px-2">
              <CldUploadWidget 
                uploadPreset="ml_default"
                options={{ 
                  cloudName: "dnex9nw0f",
                  cropping: true,
                  showSkipCropButton: false,
                  multiple: false,
                  sources: ['local', 'url', 'camera'],
                  clientAllowedFormats: ['jpg', 'png', 'jpeg', 'webp']
                }}
                onSuccess={(result: any) => setImageUrl(result.info.secure_url)}
              >
                {({ open }) => (
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 gap-2 px-4 rounded-full font-bold transition-all active:scale-95" onClick={() => open()}>
                    <Scissors className="h-5 w-5" />
                    <span className="text-sm">Crop & Adjust Image</span>
                  </Button>
                )}
              </CldUploadWidget>
              <Button size="lg" className="rounded-full px-8 font-black shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={handlePost} disabled={isPosting || (!content.trim() && !imageUrl)}>
                {isPosting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                Post to Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-xl bg-primary/5 overflow-hidden">
          <CardContent className="p-10 text-center space-y-6">
            <div className="h-20 w-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto">
                <Rss className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
                <h3 className="font-black text-2xl tracking-tighter uppercase">Join the Conversation</h3>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed max-sm mx-auto">Log in to share your journey, post memories, and stay connected with fellow alumni.</p>
            </div>
            <Link href="/login" className="block">
              <Button className="rounded-full px-10 h-14 font-black shadow-xl shadow-primary/20">Access Private Feed</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8 pb-20">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden border-none shadow-lg bg-card transition-all hover:shadow-2xl">
            <CardHeader className="p-5 flex flex-row items-center justify-between border-b border-muted/30">
              <div className="flex items-center gap-4">
                <Link href={`/users/${post.authorId}`}>
                    <Avatar className="h-12 w-12 ring-2 ring-primary/5 ring-offset-2 hover:scale-105 transition-transform">
                    <AvatarImage src={post.authorAvatarUrl} />
                    <AvatarFallback className="font-bold bg-muted">{post.authorName?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-tight leading-none mb-1">{post.authorName || 'Nexus Alumnus'}</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{post.createdAt?.toDate?.()?.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) || 'JUST NOW'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && isEditMode && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 text-destructive hover:bg-red-50" 
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6">
                <p className="text-base leading-relaxed font-medium text-zinc-800">{post.content}</p>
              </div>
              {post.imageUrl && (
                <div className="relative h-[400px] w-full bg-zinc-100 group overflow-hidden">
                  <Image src={post.imageUrl} alt="Post media" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                 </div>
              )}
            </CardContent>
            <CardFooter className="p-3 border-t border-muted/30 flex items-center justify-around bg-zinc-50/50">
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2 font-black uppercase tracking-widest hover:text-primary transition-colors h-11 rounded-xl">
                <ThumbsUp className="h-4 w-4" /> {post.likes} <span className="hidden sm:inline">Likes</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2 font-black uppercase tracking-widest hover:text-primary transition-colors h-11 rounded-xl">
                 <MessageSquare className="h-4 w-4" /> <span className="hidden sm:inline">Comment</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2 font-black uppercase tracking-widest hover:text-primary transition-colors h-11 rounded-xl">
                <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}