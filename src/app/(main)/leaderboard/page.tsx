
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase, useFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, Professor, SiteContent } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal, Loader2, TrendingUp, ShieldCheck, BrainCircuit, Sparkles, Edit } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { analyzeFacultyReputation } from '@/ai/flows/faculty-ranker';
import { useToast } from '@/hooks/use-toast';
import { ADMIN_EMAIL } from '@/lib/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
          {Object.keys(data).map((key) => (
            <div key={key} className="space-y-2">
              <label className="capitalize text-sm font-bold text-muted-foreground block">{key.replace(/([A-Z])/g, ' $1')}</label>
              {key.toLowerCase().includes('description') || key.toLowerCase().includes('summary') ? (
                <Textarea value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
              ) : (
                <Input value={data[key] || ""} onChange={(e) => setData({ ...data, [key]: e.target.value })} />
              )}
            </div>
          ))}
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

export default function LeaderboardPage() {
  const { user: authUser, isEditMode } = useFirebase();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAuditing, setIsAuditing] = useState(false);
  const isAdmin = authUser?.email === ADMIN_EMAIL;

  const bannerDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'leaderboard_banner'), [firestore]);
  const { data: bannerContent } = useDoc<SiteContent>(bannerDocRef);

  const infoDocRef = useMemoFirebase(() => doc(firestore, 'siteContent', 'leaderboard_info'), [firestore]);
  const { data: infoContent } = useDoc<SiteContent>(infoDocRef);

  const defaultBanner = {
    statusText: "Live Real-Time Rankings",
    aiText: "AI Analyzed Rankings"
  };

  const defaultInfo = {
    title: "About Nexus AI Rankings",
    description: "The **Faculty Excellence Leaderboard** is now powered by Nexus AI. Our system doesn't just look at stars; it analyzes mentor availability, research impact, and detailed student sentiment to determine a member's true academic reputation.",
    buttonText: "Learn More About AI Reputation"
  };

  const banner = bannerContent?.data || defaultBanner;
  const info = infoContent?.data || defaultInfo;

  const professorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'professor'),
      limit(100)
    );
  }, [firestore]);

  const { data: rawProfessors, isLoading } = useCollection<User>(professorsQuery);

  const professors = useMemo(() => {
    if (!rawProfessors) return [];
    return [...rawProfessors].sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0));
  }, [rawProfessors]);

  const runReputationAudit = async () => {
    if (!firestore || !professors.length) return;
    setIsAuditing(true);
    try {
      const topFaculty = professors.slice(0, 10);
      const result = await analyzeFacultyReputation({
        facultyMembers: topFaculty.map(p => ({
          id: p.id,
          name: p.name,
          department: (p as Professor).department,
          feedbackRating: p.feedbackRating || 0,
          feedbackCount: p.feedbackCount || 0,
          researchInterests: (p as Professor).researchInterests || [],
        }))
      });

      const updatePromises = result.analyzedFaculty.map(analysis => {
        const docRef = doc(firestore, 'users', analysis.id);
        return updateDoc(docRef, {
          aiReputationPersona: analysis.persona,
          aiReputationSummary: analysis.summary,
          updatedAt: new Date(),
        });
      });

      await Promise.all(updatePromises);
      toast({ title: "Audit Complete", description: "Nexus AI has refined faculty reputations based on performance quality." });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Audit Error", description: "AI reputation engine is currently overloaded." });
    } finally {
      setIsAuditing(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />;
      case 1: return <Medal className="h-7 w-7 text-slate-400" />;
      case 2: return <Award className="h-7 w-7 text-amber-600" />;
      default: return <span className="font-black text-muted-foreground w-8 text-center text-xl">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Faculty Excellence" 
        description="Recognizing the most impactful professors across the Nexus network. Rankings are dynamic, powered by student feedback and AI reputation intelligence." 
      >
        <Button 
          onClick={runReputationAudit} 
          disabled={isAuditing || isLoading} 
          variant="outline" 
          className="gap-2 font-black rounded-xl border-primary/20 text-primary hover:bg-primary/5"
        >
          {isAuditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Run AI Reputation Audit
        </Button>
      </PageHeader>

      <div className="flex items-center justify-between bg-primary/5 p-5 rounded-[1.5rem] border border-primary/10 shadow-sm relative">
        <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
            <p className="text-sm font-black text-primary uppercase tracking-tighter">
              {banner.statusText}
              {isAdmin && isEditMode && <AdminEditDialog pageId="leaderboard" sectionId="banner" initialData={banner} label="Banner Text" />}
            </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold uppercase">{banner.aiText}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Calculating Reputation Scores...</p>
        </div>
      ) : (professors && professors.length > 0) ? (
        <div className="grid gap-6">
          {professors.map((professor, index) => (
            <Card key={professor.id} className={`overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02] ${index === 0 ? 'border-2 border-yellow-500/30 bg-yellow-50/10' : index < 3 ? 'border-primary/20 bg-primary/5' : 'border-none shadow-sm bg-card'}`}>
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-6 p-6 md:p-8">
                    <div className="flex-shrink-0 flex items-center justify-center w-12">
                      {getRankIcon(index)}
                    </div>
                    
                    <Link href={`/users/${professor.id}`}>
                      <div className="relative">
                          <Avatar className={`h-16 w-16 md:h-24 md:w-24 ring-4 ring-background shadow-2xl transition-transform hover:scale-110 ${index === 0 ? 'ring-yellow-500/20' : ''}`}>
                          <AvatarImage src={professor.avatarUrl} alt={professor.name} className="object-cover" />
                          <AvatarFallback className="bg-muted font-black text-2xl">
                              {professor.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                          </Avatar>
                          {index === 0 && <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1 shadow-lg"><Star className="h-4 w-4 fill-current" /></div>}
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1.5">
                        <Link href={`/users/${professor.id}`}>
                          <h3 className="font-black text-2xl tracking-tight leading-none hover:text-primary transition-colors truncate">
                            {professor.name}
                          </h3>
                        </Link>
                        {professor.aiReputationPersona && (
                          <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black px-2 h-5 tracking-tighter">
                            AI: {professor.aiReputationPersona}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate font-bold uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary opacity-50" />
                        {(professor as Professor).department || 'Nexus Faculty'}
                      </p>
                      <div className="flex gap-2 mt-3">
                          {professor.researchInterests?.slice(0, 3).map((interest, i) => (
                              <Badge key={i} variant="secondary" className="text-[9px] font-black uppercase tracking-tighter opacity-80 px-2">{interest}</Badge>
                          ))}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-2 text-primary font-black text-3xl md:text-5xl tracking-tighter">
                        <span>{professor.feedbackRating || 0}</span>
                        <Star className="h-6 w-6 md:h-8 md:w-8 fill-current" />
                      </div>
                      <div className="flex flex-col items-end">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                              Reputation
                          </p>
                          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary font-black mt-1">
                              {professor.feedbackCount || 0} REVIEWS
                          </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {professor.aiReputationSummary && (
                    <div className="px-8 pb-8">
                      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/5">
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          <BrainCircuit className="h-3 w-3 inline mr-2 text-primary opacity-50" />
                          "{professor.aiReputationSummary}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted">
          <Trophy className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
          <p className="text-muted-foreground font-black text-xl">Ranking engine initializing...</p>
          <p className="text-sm text-muted-foreground mt-2">No ranked faculty members found in this category.</p>
        </div>
      )}

      <Card className="border-none bg-zinc-900 text-white rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
        {isAdmin && isEditMode && <AdminEditDialog pageId="leaderboard" sectionId="info" initialData={info} label="Info Card Content" overlay />}
        <CardContent className="p-12 text-center space-y-6 relative z-10">
          <h3 className="font-black text-3xl font-headline tracking-tighter">{info.title}</h3>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium text-lg whitespace-pre-wrap">
            {info.description}
          </p>
          <div className="pt-4">
             <Link href="/about">
                <Button variant="secondary" className="font-black px-10 h-12 rounded-xl">
                  {info.buttonText}
                </Button>
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
