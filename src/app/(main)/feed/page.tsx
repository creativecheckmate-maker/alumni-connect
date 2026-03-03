
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Send, MoreVertical, Trash2, X } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import type { FeedPost, User } from '@/lib/definitions';
import { ADMIN_EMAIL } from '@/lib/config';
import Image from 'next/image';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

export default function FeedPage() {
  const { user, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isAdmin = user?.email === ADMIN_EMAIL;

  // Fetch the current user's full profile to get the real avatarUrl
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
    toast({ title: "Post Shared", description: "Your update has been shared with the community." });
  };

  const handleDeletePost = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'feed', id));
    toast({ title: "Post Deleted", description: "The post has been removed." });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Community Feed" />

      {user ? (
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userProfile?.avatarUrl || user?.photoURL || ''} />
                <AvatarFallback>{userProfile?.name?.[0] || user?.displayName?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea 
                    placeholder="Share an update or a memory with the community..." 
                    className="min-h-[100px] border-none focus-visible:ring-0 bg-muted/20 resize-none p-4 text-sm rounded-xl"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                {imageUrl && (
                  <div className="relative rounded-xl overflow-hidden group h-48">
                    <Image src={imageUrl} alt="Upload preview" fill className="object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setImageUrl(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <CldUploadWidget 
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                onSuccess={(result: any) => setImageUrl(result.info.secure_url)}
              >
                {({ open }) => (
                  <Button variant="ghost" size="sm" className="text-muted-foreground gap-2" onClick={() => open()}>
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-xs">Add Photo</span>
                  </Button>
                )}
              </CldUploadWidget>
              <Button size="sm" className="rounded-full px-6 font-bold" onClick={handlePost} disabled={!content.trim() && !imageUrl}>
                Post <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm bg-primary/5">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="font-bold text-lg">Join the Conversation</h3>
            <p className="text-sm text-muted-foreground">Log in to share updates, memories, and connect with the Nexus community.</p>
            <Link href="/login">
              <Button className="rounded-full px-8 font-bold">Log In to Post</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6 pb-10">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden border-none shadow-sm">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.authorAvatarUrl} />
                  <AvatarFallback>{post.authorName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">{post.authorName || 'Nexus Alumnus'}</span>
                  <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isAdmin && isEditMode && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive" 
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 pb-4">
                <p className="text-sm leading-relaxed">{post.content}</p>
              </div>
              {post.imageUrl && (
                <div className="relative h-64 w-full bg-muted">
                  <Image src={post.imageUrl} alt="Post media" fill className="object-cover" />
                 </div>
              )}
            </CardContent>
            <CardFooter className="p-2 border-t flex items-center justify-around">
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2 font-medium hover:text-primary transition-colors">
                <ThumbsUp className="h-4 w-4" /> {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2 font-medium hover:text-primary transition-colors">
                 <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2 font-medium hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
