
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight, Calendar, Edit, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { ADMIN_EMAIL } from '@/lib/config';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { SiteContent } from '@/lib/definitions';
import { CldUploadWidget } from 'next-cloudinary';

function AdminEditDialog({ sectionId, initialData, label }: { sectionId: string, initialData: any, label: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'siteContent', `news_${sectionId}`), {
        id: `news_${sectionId}`,
        pageId: 'news',
        sectionId,
        data,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Updated", description: `${label} saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to save." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className="rounded-full shadow-lg">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(initialData).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              <div className="flex gap-2">
                {key.toLowerCase().includes('description') || key.toLowerCase().includes('content') ? (
                  <Textarea 
                    value={data[key]} 
                    onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                  />
                ) : (
                  <Input 
                    value={data[key]} 
                    onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                  />
                )}
                {key.toLowerCase().includes('url') && (
                  <CldUploadWidget 
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                    onSuccess={(result: any) => setData({ ...data, [key]: result.info.secure_url })}
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
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NewsPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const [isPosting, setIsPosting] = useState(false);
  const [open, setOpen] = useState(false);
  const [newsImageUrl, setNewsImageUrl] = useState<string | null>(null);

  const introDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'news_intro'), [firestore]);
  const { data: introContent } = useDoc<SiteContent>(introDocRef);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'siteContent');
  }, [firestore]);

  const { data: newsDocs } = useCollection(newsQuery);
  const newsItems = newsDocs?.filter(doc => doc.pageId === 'news' && doc.sectionId === 'article') || [];

  const defaultIntro = {
    description: "Stay updated with the latest breakthroughs, achievements, and community stories from across the Nexus network."
  };
  const currentIntro = introContent?.data || defaultIntro;

  const handleAddNews = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    setIsPosting(true);

    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(firestore, 'siteContent'), {
        pageId: 'news',
        sectionId: 'article',
        data: {
          title: formData.get('title'),
          category: formData.get('category'),
          description: formData.get('description'),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          imageUrl: newsImageUrl || `https://picsum.photos/seed/${Math.random()}/800/400`,
        },
        updatedAt: serverTimestamp(),
      });
      toast({ title: "News Published", description: "The article is now live." });
      setNewsImageUrl(null);
      setOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to post news." });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'siteContent', id));
    toast({ title: "Deleted", description: "News article removed." });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader title="University News">
        <div className="flex items-center gap-4">
          <Newspaper className="h-6 w-6 text-primary" />
          {isAdmin && isEditMode && (
            <>
              <AdminEditDialog sectionId="intro" initialData={currentIntro} label="Page Intro" />
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 rounded-full">
                    <Plus className="h-4 w-4" /> Add Article
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish News Article</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddNews} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input name="title" placeholder="Article Title" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input name="category" placeholder="e.g. Achievement, Research" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea name="description" placeholder="Summary of the article..." required />
                    </div>
                    <div className="space-y-2">
                      <Label>Thumbnail Image</Label>
                      <div className="flex gap-2">
                        <Input value={newsImageUrl || ""} placeholder="Image URL (will be set after upload)" readOnly />
                        <CldUploadWidget 
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                          onSuccess={(result: any) => setNewsImageUrl(result.info.secure_url)}
                        >
                          {({ open }) => (
                            <Button type="button" variant="outline" onClick={() => open()}>
                              <Upload className="h-4 w-4 mr-2" /> Upload
                            </Button>
                          )}
                        </CldUploadWidget>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isPosting}>
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Publish
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </PageHeader>

      <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
        {currentIntro.description}
      </p>

      <div className="grid gap-8">
        {newsItems.length > 0 ? (
          newsItems.map((news) => (
            <Card key={news.id} className="overflow-hidden border-none shadow-sm group relative">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 relative h-48 md:h-full overflow-hidden">
                  <Image
                    src={news.data.imageUrl}
                    alt={news.data.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                </div>
                <div className="md:col-span-3 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{news.data.category}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
                          <Calendar className="h-3 w-3" /> {news.data.date}
                        </span>
                      </div>
                      {isAdmin && isEditMode && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(news.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{news.data.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{news.data.description}</p>
                  </div>
                  <div className="mt-6">
                    <Button variant="link" className="p-0 h-auto font-bold text-primary gap-2">
                      Read Full Story <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
            <p className="text-muted-foreground">No news articles published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
