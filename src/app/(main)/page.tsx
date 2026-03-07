
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { useFirebase, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { ArrowRight, Star, GraduationCap, Briefcase, Users, Globe, Trophy, Edit, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { collection, query, where, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, SiteContent } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ADMIN_EMAIL } from '@/lib/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CldUploadWidget } from 'next-cloudinary';

function UserRatingCard({ user }: { user: User }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-card/50 backdrop-blur-sm group">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 ring-4 ring-primary/5 transition-transform group-hover:scale-105">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">{user.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">{user.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{user.college}</p>
          </div>
        </div>
        {user.role !== 'student' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-muted-foreground">Reputation Score</span>
              <span className="text-primary flex items-center gap-1">
                {user.feedbackRating || 0}/100 <Star className="h-3 w-3 fill-current" />
              </span>
            </div>
            <Progress value={user.feedbackRating || 0} className="h-2.5 bg-primary/10" />
          </div>
        )}
        <div className="mt-6">
             <Link href={`/users/${user.id}`}>
                <Button variant="outline" size="sm" className="w-full font-bold h-10 hover:bg-primary hover:text-white transition-colors">
                    View Full Profile
                </Button>
             </Link>
        </div>
      </CardContent>
    </Card>
  );
}

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
      toast({ title: "Content Updated", description: `${label} has been saved.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update content." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className={`${overlay ? 'absolute top-4 right-4 z-50' : ''} rounded-full shadow-lg`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(data).map((key) => {
            if (key === 'stats' && Array.isArray(data[key])) {
              return (
                <div key={key} className="space-y-4">
                  <label className="text-base font-bold block">Metrics</label>
                  {data[key].map((stat: any, index: number) => (
                    <div key={index} className="grid grid-cols-2 gap-2 p-2 border rounded-xl">
                      <Input value={stat.label || ""} onChange={(e) => {
                        const newStats = [...data.stats];
                        newStats[index].label = e.target.value;
                        setData({ ...data, stats: newStats });
                      }} placeholder="Label" />
                      <Input value={stat.value || ""} onChange={(e) => {
                        const newStats = [...data.stats];
                        newStats[index].value = e.target.value;
                        setData({ ...data, stats: newStats });
                      }} placeholder="Value" />
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div key={key} className="space-y-2">
                <label className="capitalize text-sm font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
                {key.toLowerCase().includes('description') ? (
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
                          {({ open }) => <Button variant="outline" size="icon" onClick={() => open()}><Upload className="h-4 w-4" /></Button>}
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

export default function HomePage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const configDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'global_config'), [firestore]);
  const { data: globalConfig } = useDoc<SiteContent>(configDocRef);

  const heroDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'home_hero'), [firestore]);
  const { data: heroContent } = useDoc<SiteContent>(heroDocRef);

  const statsDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'home_stats'), [firestore]);
  const { data: statsContent } = useDoc<SiteContent>(statsDocRef);

  const communityDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'home_community'), [firestore]);
  const { data: communityContent } = useDoc<SiteContent>(communityDocRef);

  const bannerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'home_banner'), [firestore]);
  const { data: bannerContent } = useDoc<SiteContent>(bannerDocRef);

  const reconnectDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'home_reconnect'), [firestore]);
  const { data: reconnectContent } = useDoc<SiteContent>(reconnectDocRef);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isVisibleInDirectory', '==', true), limit(20));
  }, [firestore]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const defaultHero = {
    badge: "🚀 Trusted by 25,000+ Alumni",
    title: "Connecting Our Global Legacy",
    description: "The official portal for Nexus University graduates to stay connected, find opportunities, and empower the next generation.",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756cdfb3f?q=80&w=2070",
    primaryButton: "Join the Network",
  };

  const defaultCommunity = {
    badge: "Community Highlights",
    title: "Recognizing Excellence",
    description: "Discover the most impactful members of our network, ranked by the community."
  };

  const defaultBanner = {
    badge: "Global Ranking",
    title: "Top 5 Globally for Teaching Excellence",
    description: "Our commitment to academic brilliance is reflected in our graduates.",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976",
    buttonText: "Our Journey"
  };

  const defaultReconnect = {
    title: "Ready to re-connect?",
    description: "Join the official Nexus Alumni Network today and unlock mentorship and career growth.",
    primaryButton: "Create My Profile",
    secondaryButton: "How it Works"
  };

  const hero = heroContent?.data || defaultHero;
  const community = communityContent?.data || defaultCommunity;
  const banner = bannerContent?.data || defaultBanner;
  const reconnect = reconnectContent?.data || defaultReconnect;
  const stats = statsContent?.data?.stats || [
    { label: 'Global Alumni', value: '25K+', icon: 'Globe' },
    { label: 'Job Placements', value: '12K+', icon: 'Briefcase' },
    { label: 'Mentors', value: '1.5K', icon: 'Users' },
    { label: 'Avg Rating', value: '92%', icon: 'Star' },
  ];

  const students = allUsers?.filter(u => u.role === 'student').slice(0, 3) || [];
  const professors = allUsers?.filter(u => u.role === 'professor').slice(0, 3) || [];

  const hideProfessors = globalConfig?.data?.hideProfessors === true;

  return (
    <div className="flex-1 space-y-20 pb-20">
      <section className="relative h-[70vh] min-h-[600px] w-full rounded-[2rem] overflow-hidden shadow-2xl">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="hero" initialData={hero} label="Hero Section" overlay />}
        <Image src={hero.imageUrl} alt="Nexus Hero" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex h-full flex-col items-start justify-center text-left text-white p-8 md:p-20 max-w-5xl">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-1 mb-6 text-sm backdrop-blur-md">{hero.badge}</Badge>
          <h1 className="font-headline text-5xl md:text-8xl font-bold tracking-tighter leading-none mb-6">{hero.title}</h1>
          <p className="max-w-xl text-lg md:text-2xl text-white/90 font-body leading-relaxed mb-10">{hero.description}</p>
          <div className="flex gap-4">
            <Link href="/login"><Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl">{hero.primaryButton}</Button></Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-32 relative z-20">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="stats" initialData={{ stats }} label="Metrics Dashboard" overlay />}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat: any, i: number) => (
            <Card key={i} className="border-none shadow-xl bg-background/80 backdrop-blur-lg">
              <CardContent className="p-6 text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                  {stat.icon === 'Globe' && <Globe className="h-5 w-5" />}
                  {stat.icon === 'Briefcase' && <Briefcase className="h-5 w-5" />}
                  {stat.icon === 'Users' && <Users className="h-5 w-5" />}
                  {stat.icon === 'Star' && <Star className="h-5 w-5" />}
                </div>
                <div className="text-3xl font-bold font-headline">{stat.value}</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-10 relative">
          {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="community" initialData={community} label="Community Intro" overlay />}
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                  <div className="max-w-2xl space-y-4">
                    <Badge variant="outline" className="text-primary border-primary/20 font-bold px-3 py-1">{community.badge}</Badge>
                    <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">{community.title}</h2>
                    <p className="text-muted-foreground text-lg">{community.description}</p>
                  </div>
                  <Link href="/directory"><Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 gap-2">View Full Directory <ArrowRight className="h-4 w-4" /></Button></Link>
              </div>

              {isUsersLoading ? (
                  <div className="grid gap-8 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}</div>
              ) : (
                  <Tabs defaultValue="students" className="w-full">
                      <div className="flex justify-center mb-10">
                          <TabsList className={`grid w-full max-w-lg h-14 p-1 bg-muted/50 rounded-2xl ${(!hideProfessors) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              <TabsTrigger value="students" className="rounded-xl font-bold gap-2">Students</TabsTrigger>
                              {(isAdmin || !hideProfessors) && <TabsTrigger value="professors" className="rounded-xl font-bold gap-2">Professors</TabsTrigger>}
                          </TabsList>
                      </div>
                      <TabsContent value="students" className="grid gap-6 md:grid-cols-3">{students.map(u => <UserRatingCard key={u.id} user={u} />)}</TabsContent>
                      <TabsContent value="professors" className="grid gap-6 md:grid-cols-3">{professors.map(u => <UserRatingCard key={u.id} user={u} />)}</TabsContent>
                  </Tabs>
              )}
          </div>
      </section>

      <section className="container mx-auto px-4 relative">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="banner" initialData={banner} label="Recognition Banner" overlay />}
        <div className="bg-primary text-white rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="p-10 md:p-20 space-y-8">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-sm font-bold border border-white/20"><Trophy className="h-4 w-4 text-secondary" /> {banner.badge}</div>
                  <h2 className="font-headline text-4xl md:text-6xl font-bold leading-tight">{banner.title}</h2>
                  <p className="text-xl text-white/80 leading-relaxed font-body">{banner.description}</p>
                  <Link href="/about"><Button size="lg" variant="secondary" className="font-bold h-14 px-8 rounded-xl shadow-lg">{banner.buttonText}</Button></Link>
              </div>
              <div className="relative h-full min-h-[400px]"><Image src={banner.imageUrl} alt="Recognition" fill className="object-cover" /></div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 text-center py-20 space-y-8 relative">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="reconnect" initialData={reconnect} label="CTA Section" overlay />}
        <h2 className="font-headline text-5xl font-bold tracking-tight">{reconnect.title}</h2>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">{reconnect.description}</p>
        <div className="flex justify-center gap-6">
          <Link href="/login"><Button size="lg" className="h-16 px-12 rounded-2xl text-xl font-bold shadow-xl">{reconnect.primaryButton}</Button></Link>
          <Link href="/about"><Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl text-xl font-bold border-2">{reconnect.secondaryButton}</Button></Link>
        </div>
      </section>
    </div>
  );
}
