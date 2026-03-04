'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { User, Professor } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal, Loader2 } from 'lucide-react';
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
      case 0: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1: return <Medal className="h-6 w-6 text-slate-400" />;
      case 2: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <PageHeader 
        title="Professor Leaderboard" 
        description="Recognizing academic excellence and community contributions from our esteemed faculty." 
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (professors && professors.length > 0) ? (
        <div className="grid gap-4">
          {professors.map((professor, index) => (
            <Card key={professor.id} className={`overflow-hidden transition-all hover:shadow-md ${index < 3 ? 'border-primary/20 bg-primary/5' : 'border-none shadow-sm'}`}>
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4 md:p-6">
                  <div className="flex-shrink-0 flex items-center justify-center w-10">
                    {getRankIcon(index)}
                  </div>
                  
                  <Link href={`/users/${professor.id}`}>
                    <Avatar className="h-12 w-12 md:h-16 md:w-16 ring-2 ring-background shadow-sm hover:scale-105 transition-transform">
                      <AvatarImage src={professor.avatarUrl} alt={professor.name} />
                      <AvatarFallback className="bg-muted font-bold">
                        {professor.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/users/${professor.id}`}>
                        <h3 className="font-bold text-lg leading-none hover:text-primary transition-colors truncate">
                          {professor.name}
                        </h3>
                      </Link>
                      {index === 0 && <Badge className="bg-yellow-500 text-[10px] uppercase font-bold px-1.5 h-4">Top Rated</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate font-medium">
                      {(professor as Professor).department || 'Nexus Faculty'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-primary font-black text-xl">
                      <span>{professor.feedbackRating || 0}</span>
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                      {professor.feedbackCount || 0} REVIEWS
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
          <p className="text-muted-foreground font-medium">No ranked faculty members found.</p>
        </div>
      )}

      <Card className="border-none bg-muted/30">
        <CardContent className="p-8 text-center space-y-4">
          <h3 className="font-bold text-xl">About Rankings</h3>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Rankings are determined by community feedback scores from students and alumni. 
            The Nexus Reputation Score aggregates expertise, mentorship availability, and platform engagement 
            to identify the most impactful contributors to our academic network.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}