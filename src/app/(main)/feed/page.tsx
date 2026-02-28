
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Send, MoreVertical } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import type { FeedPost } from '@/lib/definitions';
import Image from 'next/image';
import { useState } from 'react';

export default function FeedPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [content, setContent] = useState('');

  const feedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feed'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts } = useCollection<FeedPost>(feedQuery);

  const handlePost = async () => {
    if (!firestore || !user || !content.trim()) return;
    await addDoc(collection(firestore, 'feed'), {
      authorId: user.uid,
      content,
      likes: 0,
      createdAt: serverTimestamp(),
    });
    setContent('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader title="Community Feed" />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <Textarea 
                placeholder="Share an update or a memory with the community..." 
                className="min-h-[100px] border-none focus-visible:ring-0 bg-muted/20 resize-none p-4 text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between border-t pt-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-xs">Add Photo</span>
            </Button>
            <Button size="sm" className="rounded-full px-6" onClick={handlePost}>
              Post <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 pb-10">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="p-4 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Author</span>
                  <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
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
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2">
                <ThumbsUp className="h-4 w-4" /> {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 text-xs gap-2">
                <Share2 className="h-4 w-4" /> Share
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
