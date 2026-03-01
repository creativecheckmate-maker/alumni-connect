
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight, Calendar, Edit, Loader2, Plus } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { ADMIN_EMAIL } from '@/lib/config';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function NewsPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const [isPosting, setIsPosting] = useState(false);
  const [open, setOpen] = useState(false);

  const newsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'siteContent');
  }, [firestore]);

  const { data: newsDocs } = useCollection(newsQuery);
  const newsItems = newsDocs?.filter(doc => doc.pageId === 'news') || [];

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
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/400`,
        },
        updatedAt: serverTimestamp(),
      });
      toast({ title: "News Published", description: "The article is now live." });
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
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
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
                  <DialogFooter>
                    <Button type="submit" disabled={isPosting}>
                      {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publish
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageHeader>

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
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(news.id)}>
                          <Plus className="h-4 w-4 rotate-45" />
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
