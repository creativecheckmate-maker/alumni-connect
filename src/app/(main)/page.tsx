'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { useFirebase, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { ArrowRight, Star, GraduationCap, Briefcase, Users, Globe, Trophy, Edit, Loader2, Image as ImageIcon } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const getPlaceholderImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) {
      return { imageUrl: "https://picsum.photos/seed/placeholder/1920/1080", description: 'Placeholder', imageHint: 'placeholder' };
    }
    return img;
}

function UserRatingCard({ user }: { user: User }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-card/50 backdrop-blur-sm group">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20 ring-4 ring-primary/5 transition-transform group-hover:scale-105">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">{user.name}</h4>
            <p className="text-sm text-muted-foreground truncate">{user.college}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-muted-foreground">Reputation Score</span>
            <span className="text-primary flex items-center gap-1">
              {user.feedbackRating || 0}/100 <Star className="h-3 w-3 fill-current" />
            </span>
          </div>
          <Progress value={user.feedbackRating || 0} className="h-2.5 bg-primary/10" />
        </div>
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
      toast({ title: "Content Updated", description: `${label} has been saved successfully.` });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error", description: "Failed to update content." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="secondary" className={`${overlay ? 'absolute top-4 right-4 z-50' : ''} rounded-full shadow-lg`}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.keys(initialData).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
              {key.toLowerCase().includes('description') || key.toLowerCase().includes('content') ? (
                <Textarea 
                  value={data[key]} 
                  onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                />
              ) : (
                <div className="flex gap-2">
                  <Input 
                    value={data[key]} 
                    onChange={(e) => setData({ ...data, [key]: e.target.value })} 
                  />
                  {key.toLowerCase().includes('url') && <ImageIcon className="h-4 w-4 text-muted-foreground self-center" />}
                </div>
              )}
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

export default function HomePage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const isAdmin = authUser?.email === ADMIN_EMAIL;

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
    return query(
      collection(firestore, 'users'),
      where('isVisibleInDirectory', '==', true),
      limit(20)
    );
  }, [firestore]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const heroImage = getPlaceholderImage('hero-home');
  const professorImage = getPlaceholderImage('professor-portrait');

  const students = allUsers?.filter(u => u.role === 'student').sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0)).slice(0, 3) || [];
  const professors = allUsers?.filter(u => u.role === 'professor').sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0)).slice(0, 3) || [];
  const staff = allUsers?.filter(u => u.role === 'non-teaching-staff').sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0)).slice(0, 3) || [];

  const defaultHero = {
    badge: "🚀 Trusted by 25,000+ Alumni",
    title: "Connecting Our Global Legacy",
    description: "The official portal for Nexus University graduates to stay connected, find opportunities, and empower the next generation.",
    imageUrl: heroImage.imageUrl,
    primaryButtonText: "Join the Network",
    secondaryButtonText: "Alumni Login",
    dashboardButtonText: "My Dashboard"
  };

  const defaultCommunity = {
    badge: "Community Highlights",
    title: "Recognizing Excellence",
    description: "Discover the most impactful members of our network, ranked by the community for their contributions and expertise."
  };

  const defaultBanner = {
    badge: "Global Ranking",
    title: "Top 5 Globally for Teaching Excellence",
    description: "Our commitment to academic brilliance is reflected in the success of our graduates across every major industry worldwide.",
    imageUrl: professorImage.imageUrl,
    buttonText: "Our Academic Journey",
    buttonUrl: "/about"
  };

  const defaultReconnect = {
    title: "Ready to re-connect?",
    description: "Join the official Nexus Alumni Network today and unlock a world of professional mentorship, job opportunities, and lifelong friendships.",
    primaryButtonText: "Create My Profile",
    primaryButtonUrl: "/login",
    secondaryButtonText: "How it Works",
    secondaryButtonUrl: "/about"
  };

  const currentHero = heroContent?.data || defaultHero;
  const currentCommunity = communityContent?.data || defaultCommunity;
  const currentBanner = bannerContent?.data || defaultBanner;
  const currentReconnect = reconnectContent?.data || defaultReconnect;
  const currentStats = statsContent?.data?.stats || [
    { label: 'Global Alumni', value: '25K+', icon: 'Globe' },
    { label: 'Job Placements', value: '12K+', icon: 'Briefcase' },
    { label: 'Mentors', value: '1.5K', icon: 'Users' },
    { label: 'Avg Rating', value: '92%', icon: 'Star' },
  ];

  return (
    <div className="flex-1 space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] w-full rounded-[2rem] overflow-hidden shadow-2xl">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="hero" initialData={currentHero} label="Hero Section" overlay />}
        <Image
          src={currentHero.imageUrl || heroImage.imageUrl}
          alt="Nexus Hero"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
        <div className="relative z-10 flex h-full flex-col items-start justify-center text-left text-white p-8 md:p-20 max-w-5xl">
          <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-1 mb-6 text-sm backdrop-blur-md">
            {currentHero.badge}
          </Badge>
          <h1 className="font-headline text-5xl md:text-8xl font-bold tracking-tighter leading-none mb-6">
            {currentHero.title}
          </h1>
          <p className="max-w-xl text-lg md:text-2xl text-white/90 font-body leading-relaxed mb-10">
            {currentHero.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {authUser ? (
              <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl shadow-black/20 hover:scale-105 transition-transform">
                      {currentHero.dashboardButtonText || "My Dashboard"} <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
              </Link>
            ) : (
              <>
                  <Link href="/login">
                      <Button size="lg" variant="secondary" className="h-16 px-10 text-xl font-bold rounded-2xl shadow-xl shadow-black/20 hover:scale-105 transition-transform">
                        {currentHero.primaryButtonText || "Join the Network"}
                      </Button>
                  </Link>
                  <Link href="/login">
                      <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold rounded-2xl border-white/50 text-white hover:bg-white hover:text-primary backdrop-blur-sm">
                        {currentHero.secondaryButtonText || "Alumni Login"}
                      </Button>
                  </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="container mx-auto px-4 -mt-32 relative z-20">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="stats" initialData={{ stats: currentStats }} label="Stats Section" overlay />}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentStats.map((stat: any, i: number) => (
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

      {/* Community Section */}
      <section className="py-10 relative">
          {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="community" initialData={currentCommunity} label="Community Intro" overlay />}
          <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                  <div className="max-w-2xl space-y-4">
                    <Badge variant="outline" className="text-primary border-primary/20 font-bold px-3 py-1">{currentCommunity.badge}</Badge>
                    <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight">{currentCommunity.title}</h2>
                    <p className="text-muted-foreground text-lg">{currentCommunity.description}</p>
                  </div>
                  <Link href="/directory">
                      <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5 gap-2">
                          View Full Directory <ArrowRight className="h-4 w-4" />
                      </Button>
                  </Link>
              </div>

              {isUsersLoading ? (
                  <div className="grid gap-8 md:grid-cols-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />)}
                  </div>
              ) : (
                  <Tabs defaultValue="students" className="w-full">
                      <div className="flex justify-center mb-10">
                          <TabsList className="grid w-full max-w-lg grid-cols-3 h-14 p-1 bg-muted/50 rounded-2xl">
                              <TabsTrigger value="students" className="rounded-xl font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                  <GraduationCap className="h-4 w-4" /> Students
                              </TabsTrigger>
                              <TabsTrigger value="professors" className="rounded-xl font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                  <Users className="h-4 w-4" /> Professors
                              </TabsTrigger>
                              <TabsTrigger value="staff" className="rounded-xl font-bold gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                  <Briefcase className="h-4 w-4" /> Staff
                              </TabsTrigger>
                          </TabsList>
                      </div>
                      
                      <TabsContent value="students" className="focus-visible:ring-0">
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {students.length > 0 ? (
                                  students.map(u => <UserRatingCard key={u.id} user={u} />)
                              ) : (
                                  <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
                                    <p className="text-muted-foreground font-medium">No student records found in this category.</p>
                                  </div>
                              )}
                          </div>
                      </TabsContent>
                      
                      <TabsContent value="professors" className="focus-visible:ring-0">
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {professors.length > 0 ? (
                                  professors.map(u => <UserRatingCard key={u.id} user={u} />)
                              ) : (
                                <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
                                  <p className="text-muted-foreground font-medium">No professor records found in this category.</p>
                                </div>
                              )}
                          </div>
                      </TabsContent>

                      <TabsContent value="staff" className="focus-visible:ring-0">
                          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                              {staff.length > 0 ? (
                                  staff.map(u => <UserRatingCard key={u.id} user={u} />)
                              ) : (
                                <div className="col-span-full py-20 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
                                  <p className="text-muted-foreground font-medium">No staff records found in this category.</p>
                                </div>
                              )}
                          </div>
                      </TabsContent>
                  </Tabs>
              )}
          </div>
      </section>

      {/* Global Recognition Banner */}
      <section className="container mx-auto px-4 relative">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="banner" initialData={currentBanner} label="Banner Section" overlay />}
        <div className="bg-primary text-white rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="p-10 md:p-20 space-y-8">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-sm font-bold border border-white/20">
                    <Trophy className="h-4 w-4 text-secondary" /> {currentBanner.badge}
                  </div>
                  <h2 className="font-headline text-4xl md:text-6xl font-bold leading-tight">{currentBanner.title}</h2>
                  <p className="text-xl text-white/80 leading-relaxed font-body">{currentBanner.description}</p>
                  <div className="flex gap-4 pt-4">
                    <Link href={currentBanner.buttonUrl || "/about"}>
                      <Button size="lg" variant="secondary" className="font-bold h-14 px-8 rounded-xl shadow-lg">{currentBanner.buttonText}</Button>
                    </Link>
                    <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 font-bold h-14 px-8 rounded-xl">Learn More</Button>
                  </div>
              </div>
              <div className="relative h-full min-h-[400px]">
                  <Image 
                    src={currentBanner.imageUrl || professorImage.imageUrl} 
                    alt="Recognition" 
                    fill 
                    className="object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-primary/50 to-transparent" />
              </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 text-center py-20 space-y-8 relative">
        {isAdmin && isEditMode && <AdminEditDialog pageId="home" sectionId="reconnect" initialData={currentReconnect} label="CTA Section" overlay />}
        <h2 className="font-headline text-5xl font-bold tracking-tight">{currentReconnect.title}</h2>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">{currentReconnect.description}</p>
        <div className="flex justify-center gap-6">
          <Link href={currentReconnect.primaryButtonUrl || "/login"}>
            <Button size="lg" className="h-16 px-12 rounded-2xl text-xl font-bold shadow-xl shadow-primary/20">
              {currentReconnect.primaryButtonText || "Create My Profile"}
            </Button>
          </Link>
          <Link href={currentReconnect.secondaryButtonUrl || "/about"}>
            <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl text-xl font-bold border-2">
              {currentReconnect.secondaryButtonText || "How it Works"}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
