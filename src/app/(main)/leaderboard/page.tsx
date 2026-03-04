'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { User, Professor } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal, Loader2, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const professorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'professor'),
      orderBy('feedbackRating', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: professors, isLoading } = useCollection<User>(professorsQuery);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />;
      case 1: return <Medal className="h-6 w-6 text-slate-400" />;
      case 2: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="font-black text-muted-foreground w-6 text-center text-lg">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Professor Leaderboard" 
        description="Recognizing academic excellence and community contributions from our esteemed faculty. Rankings are refreshed in real-time based on community feedback." 
      />

      <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <TrendingUp className="h-5 w-5 text-primary" />
        <p className="text-sm font-bold text-primary uppercase tracking-tighter">Live Ranking: All Departments Included</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (professors && professors.length > 0) ? (
        <div className="grid gap-4">
          {professors.map((professor, index) => (
            <Card key={professor.id} className={`overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01] ${index < 3 ? 'border-primary/20 bg-primary/5 ring-1 ring-primary/5' : 'border-none shadow-sm bg-card'}`}>
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4 md:p-6">
                  <div className="flex-shrink-0 flex items-center justify-center w-12">
                    {getRankIcon(index)}
                  </div>
                  
                  <Link href={`/users/${professor.id}`}>
                    <Avatar className="h-14 w-14 md:h-20 md:w-20 ring-4 ring-background shadow-xl hover:scale-105 transition-transform">
                      <AvatarImage src={professor.avatarUrl} alt={professor.name} className="object-cover" />
                      <AvatarFallback className="bg-muted font-black text-xl">
                        {professor.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/users/${professor.id}`}>
                        <h3 className="font-black text-xl leading-none hover:text-primary transition-colors truncate">
                          {professor.name}
                        </h3>
                      </Link>
                      {index === 0 && <Badge className="bg-yellow-500 text-white border-none text-[10px] uppercase font-black px-2 h-5">Top Ranked</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate font-bold uppercase tracking-tight">
                      {(professor as Professor).department || 'Nexus Faculty'}
                    </p>
                    <div className="flex gap-2 mt-2">
                        {professor.researchInterests?.slice(0, 2).map((interest, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] font-bold opacity-70">{interest}</Badge>
                        ))}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 text-primary font-black text-2xl md:text-3xl">
                      <span>{professor.feedbackRating || 0}</span>
                      <Star className="h-5 w-5 fill-current" />
                    </div>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                            Reputation Score
                        </p>
                        <p className="text-[9px] text-primary font-bold">
                            {professor.feedbackCount || 0} COMMUNITY REVIEWS
                        </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
          <p className="text-muted-foreground font-bold">No ranked faculty members found.</p>
        </div>
      )}

      <Card className="border-none bg-muted/30 rounded-[2rem]">
        <CardContent className="p-10 text-center space-y-4">
          <h3 className="font-black text-2xl font-headline tracking-tight">About Academic Rankings</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            Rankings are determined by independent feedback scores from students and alumni. 
            The **Nexus Reputation Score** aggregates criteria including mentorship availability, 
            research impact, and platform engagement to identify our network's most impactful contributors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}