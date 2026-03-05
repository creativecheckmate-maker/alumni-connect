'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ArrowRight, Sparkles, BrainCircuit, Target, Edit, Loader2, Zap, Shield } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, useFirebase } from '@/firebase';
import { doc, collection, query, limit, where, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, Event, JobPosting, SiteContent } from '@/lib/definitions';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPersonalizedRecommendations, type PersonalizedRecommendationsOutput } from '@/ai/flows/recommendation-engine';
import { ADMIN_EMAIL } from '@/lib/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
            if (key === 'activities' && Array.isArray(data[key])) {
                return (
                    <div key={key} className="space-y-4">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Activity Log</label>
                        {data[key].map((item: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-xl space-y-2">
                                <Input value={item.title} onChange={(e) => {
                                    const next = [...data.activities];
                                    next[idx].title = e.target.value;
                                    setData({...data, activities: next});
                                }} placeholder="Title" />
                                <Textarea value={item.description} onChange={(e) => {
                                    const next = [...data.activities];
                                    next[idx].description = e.target.value;
                                    setData({...data, activities: next});
                                }} placeholder="Description" />
                            </div>
                        ))}
                    </div>
                );
            }
            return (
              <div key={key} className="space-y-2">
                <label className="capitalize text-sm font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
                {key.toLowerCase().includes('description') || key.toLowerCase().includes('subtext') ? (
                  <Textarea value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
                ) : (
                  <Input value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
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

export default function DashboardPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isAIOverviewLoading, setIsAIOverviewLoading] = useState(false);
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const contentDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'dashboard_main'), [firestore]);
  const { data: dashboardContent } = useDoc<SiteContent>(contentDocRef);

  const activityDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'dashboard_activity'), [firestore]);
  const { data: activityContent } = useDoc<SiteContent>(activityDocRef);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser } = useDoc<User>(userDocRef);

  const recentUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'), 
      where('isVisibleInDirectory', '==', true),
      limit(10)
    );
  }, [firestore]);

  const { data: users } = useCollection<User>(recentUsersQuery);

  const upcomingEventsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'), limit(3));
  }, [firestore]);

  const { data: events } = useCollection<Event>(upcomingEventsQuery);

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobPostings'), limit(5));
  }, [firestore]);
  const { data: jobs } = useCollection<JobPosting>(jobsQuery);

  const mentorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'professor'), limit(5));
  }, [firestore]);
  const { data: mentors } = useCollection<User>(mentorsQuery);

  useEffect(() => {
    async function fetchAIRecommendations() {
      if (!currentUser || !events || !jobs || !mentors || recommendations) return;
      setIsAIOverviewLoading(true);
      try {
        const result = await getPersonalizedRecommendations({
          userProfile: {
            userId: currentUser.id,
            userType: currentUser.role === 'student' ? 'student' : 'professor',
            university: currentUser.university,
            college: currentUser.college,
            major: currentUser.major,
            graduationYear: currentUser.graduationYear,
            preferences: currentUser.preferences || [],
          },
          availableEvents: events.map(e => ({ id: e.id, name: e.name, description: e.description, university: e.university, college: e.college })),
          availableJobOpportunities: jobs.map(j => ({ id: j.id, title: j.title, company: j.company, industry: j.industry })),
          availableMentors: mentors.map(m => ({ id: m.id, name: m.name, expertise: m.researchInterests?.join(', '), university: m.university, college: m.college }))
        });
        setRecommendations(result);
      } catch (e) {
        console.error("AI Recommendation error:", e);
      } finally {
        setIsAIOverviewLoading(false);
      }
    }

    fetchAIRecommendations();
  }, [currentUser, events, jobs, mentors, recommendations]);

  const defaultMain = {
    welcomeSubtext: "Welcome back to your professional hub.",
    recommendationTitle: "AI Recommended For You",
    spotlightTitle: "Alumni Spotlights",
    eventsTitle: "Upcoming Events",
    activityTitle: "Network Activity",
    activityDescription: "Stay updated with latest interactions"
  };

  const defaultActivity = {
    activities: [
        { title: "New Connection", description: "Samara Patel matched with your profile.", icon: "Target" },
        { title: "Skill Update", description: "Nexus AI found 2 new jobs matching your skills.", icon: "Sparkles" }
    ]
  };

  const main = dashboardContent?.data || defaultMain;
  const activityData = activityContent?.data || defaultActivity;

  if (!authUser) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl font-bold font-headline leading-tight">Alumni Network</h1>
           <Link href="/login">
            <Button size="sm">Log In</Button>
           </Link>
        </div>
        <Card className="max-w-md w-full text-center p-8 space-y-6 mx-auto">
          <CardHeader>
            <CardTitle>Personalize Your Experience</CardTitle>
            <CardDescription>Log in to view your personalized dashboard, AI recommendations, and network updates.</CardDescription>
          </CardHeader>
          <Link href="/login">
            <Button className="w-full font-bold h-12">Log In to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20 ring-offset-2">
            <AvatarImage src={currentUser?.avatarUrl} />
            <AvatarFallback>{currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="relative">
            <h1 className="text-2xl font-bold font-headline leading-tight">Hello {currentUser?.name?.split(' ')[0]}</h1>
            <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">{main.welcomeSubtext}</p>
                {isAdmin && isEditMode && <AdminEditDialog pageId="dashboard" sectionId="main" initialData={main} label="Dashboard Text" />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
            <Link href="/notifications">
                <Button variant="outline" size="icon" className="relative transition-transform hover:scale-105 active:scale-95">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full"></span>
                </Button>
            </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-xl font-bold font-headline">{main.recommendationTitle}</h2>
        </div>
        
        {isAIOverviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />
                ))}
            </div>
        ) : recommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.recommendedJobOpportunities?.[0] && (
                    <Card className="border-none bg-primary/5 shadow-none overflow-hidden group">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="bg-white text-[10px] uppercase font-bold tracking-tighter">Job Match</Badge>
                                <BrainCircuit className="h-4 w-4 text-primary opacity-40" />
                            </div>
                            <CardTitle className="text-sm font-bold mt-2">{recommendations.recommendedJobOpportunities[0].title}</CardTitle>
                            <CardDescription className="text-[10px]">{recommendations.recommendedJobOpportunities[0].company}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-[11px] text-muted-foreground italic line-clamp-2">"{recommendations.recommendedJobOpportunities[0].reasonsForRecommendation}"</p>
                            <Link href="/jobs">
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2 font-bold group-hover:translate-x-1 transition-transform">
                                    Apply Now <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
                {recommendations.recommendedEvents?.[0] && (
                    <Card className="border-none bg-blue-50 shadow-none overflow-hidden group">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="bg-white text-[10px] uppercase font-bold tracking-tighter">Event Pick</Badge>
                                <Target className="h-4 w-4 text-blue-600 opacity-40" />
                            </div>
                            <CardTitle className="text-sm font-bold mt-2">{recommendations.recommendedEvents[0].name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-[11px] text-muted-foreground italic line-clamp-2">"{recommendations.recommendedEvents[0].reasonsForRecommendation}"</p>
                            <Link href="/events">
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                                    RSVP <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
                {recommendations.recommendedMentors?.[0] && (
                    <Card className="border-none bg-green-50 shadow-none overflow-hidden group">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <Badge variant="secondary" className="bg-white text-[10px] uppercase font-bold tracking-tighter">Mentor Suggestion</Badge>
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[8px]">M</AvatarFallback>
                                </Avatar>
                            </div>
                            <CardTitle className="text-sm font-bold mt-2">{recommendations.recommendedMentors[0].name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-[11px] text-muted-foreground italic line-clamp-2">"{recommendations.recommendedMentors[0].reasonsForRecommendation}"</p>
                            <Link href="/mentorship">
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2 font-bold text-green-600 group-hover:translate-x-1 transition-transform">
                                    Connect <ArrowRight className="ml-1 h-3 w-3" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        ) : (
            <div className="p-8 text-center bg-muted/20 rounded-2xl border-2 border-dashed">
                <p className="text-sm text-muted-foreground">Updating AI highlights for you...</p>
            </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
            <section>
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold font-headline text-primary">{main.spotlightTitle}</h2>
                <Link href="/directory">
                    <Button variant="link" size="sm" className="text-muted-foreground p-0">View All</Button>
                </Link>
                </div>
                <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4 pb-4">
                    {users?.map((u) => (
                    <Link key={u.id} href={`/users/${u.id}`} className="flex flex-col items-center gap-2 group cursor-pointer">
                        <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-all">
                        <AvatarImage src={u.avatarUrl} />
                        <AvatarFallback>{u.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">{u.name?.split(' ')[0]}</span>
                    </Link>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </section>

            <section>
                <h2 className="text-lg font-bold font-headline text-primary mb-4">{main.eventsTitle}</h2>
                <div className="space-y-4">
                {events && events.length > 0 ? (
                    events.map((event) => (
                    <Card key={event.id} className="p-4 bg-muted/30 border-none hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 shrink-0">
                            <span className="text-[10px] font-bold uppercase">{event.date.split(' ')[0]}</span>
                            <span className="text-xl font-bold leading-none">{event.date.split(' ')[1]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold truncate">{event.name}</h3>
                            <p className="text-[11px] text-muted-foreground truncate">{event.description}</p>
                        </div>
                        <Link href="/events">
                            <Button size="icon" variant="ghost" className="text-primary hover:text-primary/80 shrink-0">
                            <ArrowRight className="h-5 w-5" />
                            </Button>
                        </Link>
                        </div>
                    </Card>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
                )}
                </div>
            </section>
        </div>

        <div className="space-y-6">
            <Card className="border-none bg-card shadow-lg relative group">
                {isAdmin && isEditMode && <AdminEditDialog pageId="dashboard" sectionId="activity" initialData={activityData} label="Network Activity Items" overlay />}
                <CardHeader>
                    <CardTitle className="text-lg">{main.activityTitle}</CardTitle>
                    <CardDescription>{main.activityDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activityData.activities.map((act: any, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                i % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                                {act.icon === 'Target' && <Target className="h-4 w-4" />}
                                {act.icon === 'Sparkles' && <Sparkles className="h-4 w-4" />}
                                {act.icon === 'Zap' && <Zap className="h-4 w-4" />}
                                {act.icon === 'Shield' && <Shield className="h-4 w-4" />}
                            </div>
                            <div>
                                <p className="text-xs font-bold">{act.title}</p>
                                <p className="text-[10px] text-muted-foreground">{act.description}</p>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Link href="/analytics" className="block">
                <Button className="w-full font-bold bg-primary hover:bg-primary/90 h-12 rounded-xl shadow-lg shadow-primary/20">
                    View Career Insights <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </div>
      </div>
    </div>
  );
}