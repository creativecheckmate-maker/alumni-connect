'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Send, MoreVertical, Trash2, X, Loader2, Rss, ShieldAlert, Upload, Edit, Sparkles } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import type { FeedPost, User, SiteContent } from '@/lib/definitions';
import { ADMIN_EMAIL, SECONDARY_ADMIN_EMAIL } from '@/lib/config';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';
import { moderateContent } from '@/ai/flows/moderation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

function AdminEditDialog({ pageId, sectionId, initialData, label, overlay = false }: { pageId: string, sectionId: string, initialData: any, label: string, overlay?: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', `${pageId}_${sectionId}`), {
        id: `${pageId}_${sectionId}`,
        pageId,
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: `${label} saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className={`${overlay ? 'absolute top-2 right-2 z-50' : 'ml-2'} h-8 w-8 rounded-full shadow-lg`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => {
            return (
              <div key={key} className="space-y-2">
                <label className="capitalize text-sm font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
                {key.toLowerCase().includes('description') || key.toLowerCase().includes('content') ? (
                  <Textarea value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {key.toLowerCase().includes('url') && data[key] && (
                      <div className="relative h-24 w-full rounded-xl overflow-hidden border bg-muted">
                        <Image src={data[key]} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
                      {key.toLowerCase().includes('url') && (
                        <CldUploadWidget 
                          uploadPreset="ml_default"
                          options={{ 
                            cloudName: "dnex9nw0f",
                            cropping: true,
                            showSkipCropButton: true,
                            singleUploadAutoClose: true,
                            multiple: false,
                            sources: ['local', 'url', 'camera']
                          }}
                          onSuccess={(res: any) => {
                            const url = res?.info?.secure_url || res?.info?.url;
                            if (url) {
                              setData((prev: any) => ({ ...prev, [key]: url }));
                            }
                          }}
                        >
                          {({ open }) => (
                            <Button variant="outline" size="icon" onClick={() => open()}>
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </CldUploadWidget>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedPage() {
  const { user, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const isAdmin = user?.email === ADMIN_EMAIL || user?.email === SECONDARY_ADMIN_EMAIL || user?.email === 'geminiak8@gmail.com' || user?.uid === 'zEyeEyDugUWHv4RYKvgntWLunXH2';

  const userProfileDocRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: userProfile } = useDoc<User>(userProfileDocRef);

  const introDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'feed_intro'), [firestore]);
  const { data: introContent } = useDoc<SiteContent>(introDocRef);

  const feedQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'feed'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts } = useCollection<FeedPost>(feedQuery);

  const defaultIntro = {
    title: "Community Feed",
    description: "Real-time updates and memories from the Nexus network.",
    moderationText: "AI Moderated Feed"
  };

  const intro = introContent?.data || defaultIntro;

  const handlePost = async () => {
    if (!firestore || !user || (!content.trim() && !imageUrl)) return;
    
    setIsPosting(true);
    try {
      const moderation = await moderateContent({ text: content, imageUrl: imageUrl || undefined });
      if (!moderation.isSafe) {
        toast({ variant: 'destructive', title: "Content Blocked", description: moderation.reason || "Post violates community standards." });
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
      toast({ title: "Published", description: "Your update has been shared." });
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
      <div className="relative group">
        <PageHeader title={intro.title} description={intro.description} />
        {isAdmin && isEditMode && <AdminEditDialog pageId="feed" sectionId="intro" initialData={intro} label="Feed Info" />}
      </div>

      {user ? (
        <Card className="border-none shadow-xl bg-card overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                <AvatarImage src={userProfile?.avatarUrl || user?.photoURL || ''} />
                <AvatarFallback className="font-bold">{userProfile?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldAlert className="h-3 w-3 text-primary opacity-50" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">{intro.moderationText}</span>
                </div>
                <Textarea 
                    placeholder="Share a professional milestone..." 
                    className="min-h-[120px] border-none bg-muted/20 resize-none p-5 text-base rounded-[1.5rem] font-medium"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                {imageUrl && (
                  <div className="relative rounded-2xl overflow-hidden h-64 border-4 border-muted/30">
                    <Image src={imageUrl} alt="Upload preview" fill className="object-cover" />
                    <Button variant="destructive" size="icon" className="absolute top-3 right-3 rounded-full" onClick={() => setImageUrl(null)}><X className="h-5 w-5" /></Button>
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
                  showSkipCropButton: true,
                  singleUploadAutoClose: true,
                  croppingAspectRatio: 1.77,
                  multiple: false,
                  sources: ['local', 'url', 'camera']
                }}
                onSuccess={(result: any) => setImageUrl(result.info.secure_url)}
              >
                {({ open }) => (
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 gap-2 px-4 rounded-full font-bold" onClick={() => open()}>
                    <ImageIcon className="h-5 w-5" /><span className="text-sm">Add Photo</span>
                  </Button>
                )}
              </CldUploadWidget>
              <Button size="lg" className="rounded-full px-8 font-black shadow-lg" onClick={handlePost} disabled={isPosting || (!content.trim() && !imageUrl)}>
                {isPosting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />} Post to Feed
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="p-10 text-center space-y-6"><Rss className="h-10 w-10 text-primary mx-auto" /><h3 className="font-black text-2xl">Join the Conversation</h3><Link href="/login"><Button className="rounded-full px-10 h-14 font-black">Access Private Feed</Button></Link></Card>
      )}

      <div className="space-y-8 pb-20">
        {posts?.map((post) => (
          <Card key={post.id} className="overflow-hidden border-none shadow-lg bg-card">
            <CardHeader className="p-5 flex flex-row items-center justify-between border-b border-muted/30">
              <div className="flex items-center gap-4">
                <Link href={`/users/${post.authorId}`}>
                    <Avatar className="h-12 w-12 hover:scale-105 transition-transform"><AvatarImage src={post.authorAvatarUrl} /><AvatarFallback className="font-bold">{post.authorName?.[0]}</AvatarFallback></Avatar>
                </Link>
                <div className="flex flex-col">
                  <span className="text-base font-black tracking-tight">{post.authorName || 'Nexus Alumnus'}</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase">{post.createdAt?.toDate?.()?.toLocaleDateString() || 'JUST NOW'}</span>
                </div>
              </div>
              {isAdmin && isEditMode && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePost(post.id)}><Trash2 className="h-4 w-4" /></Button>}
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6"><p className="text-base leading-relaxed font-medium text-zinc-800">{post.content}</p></div>
              {post.imageUrl && <div className="relative h-[400px] w-full"><Image src={post.imageUrl} alt="Post media" fill className="object-cover" /></div>}
            </CardContent>
            <CardFooter className="p-3 border-t flex justify-around"><Button variant="ghost" className="flex-1 gap-2 font-black uppercase text-xs h-11"><ThumbsUp className="h-4 w-4" /> {post.likes}</Button><Button variant="ghost" className="flex-1 gap-2 font-black uppercase text-xs h-11"><MessageSquare className="h-4 w-4" /> Comment</Button></CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}