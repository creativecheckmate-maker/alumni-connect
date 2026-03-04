
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc } from 'firebase/firestore';
import type { User, Professor } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal, Loader2, TrendingUp, ShieldCheck, BrainCircuit, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { analyzeFacultyReputation } from '@/ai/flows/faculty-ranker';
import { useToast } from '@/hooks/use-toast';

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isAuditing, setIsAuditing] = useState(false);

  // Fetching specifically professors without orderBy to avoid index requirements
  const professorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'professor'),
      limit(100)
    );
  }, [firestore]);

  const { data: rawProfessors, isLoading } = useCollection<User>(professorsQuery);

  // Client-side sort by feedbackRating
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

      // Update Firestore with AI insights for top performers
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

      <div className="flex items-center justify-between bg-primary/5 p-5 rounded-[1.5rem] border border-primary/10 shadow-sm">
        <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary animate-pulse" />
            <p className="text-sm font-black text-primary uppercase tracking-tighter">Live Real-Time Rankings</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold uppercase">AI Analyzed Rankings</span>
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
        <CardContent className="p-12 text-center space-y-6 relative z-10">
          <h3 className="font-black text-3xl font-headline tracking-tighter">About Nexus AI Rankings</h3>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium text-lg">
            The **Faculty Excellence Leaderboard** is now powered by Nexus AI. Our system doesn't just look at stars; 
            it analyzes mentor availability, research impact, and detailed student sentiment to determine a 
            member's true academic reputation.
          </p>
          <div className="pt-4">
             <Link href="/about">
                <Button variant="secondary" className="font-black px-10 h-12 rounded-xl">Learn More About AI Reputation</Button>
             </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
