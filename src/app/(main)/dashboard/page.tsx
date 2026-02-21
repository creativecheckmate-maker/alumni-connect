'use client';

import {
  getPersonalizedRecommendations,
  PersonalizedRecommendationsInput,
} from '@/ai/flows/recommendation-engine';
import { PageHeader } from '@/components/page-header';
import { events, jobPosts, mentors, users } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { User, Student, Professor } from '@/lib/definitions';
import { useDoc, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { PersonalizedRecommendationsOutput } from '@/ai/flows/recommendation-engine';
import { Skeleton } from '@/components/ui/skeleton';

function RecommendationSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  )
}

export default function DashboardPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: currentUser, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      const getRecommendations = async () => {
        setIsRecommendationsLoading(true);
        const recommendationInput: PersonalizedRecommendationsInput = {
          userProfile: {
            userId: currentUser.id,
            userType: currentUser.role,
            university: currentUser.university,
            college: currentUser.college,
            major: currentUser.role === 'student' ? (currentUser as Student).major : undefined,
            graduationYear: currentUser.role === 'student' ? (currentUser as Student).graduationYear : undefined,
            department: currentUser.role === 'professor' ? (currentUser as Professor).department : undefined,
            researchInterests: currentUser.role === 'professor' ? (currentUser as Professor).researchInterests : undefined,
            preferences: currentUser.preferences,
          },
          engagementData: {
            networkActivity: currentUser.networkActivity,
          },
          availableEvents: events.map(e => ({ id: e.id, name: e.name, description: e.description, tags: e.tags, university: e.university, college: e.college })),
          availableJobOpportunities: jobPosts.map(j => ({ id: j.id, title: j.title, company: j.company, description: j.description, industry: j.industry, university: j.university })),
          availableMentors: mentors.map(m => {
              const mentorUser = users.find(u => u.name === m.name);
              return { 
                  id: m.id, 
                  name: m.name, 
                  expertise: m.expertise, 
                  industry: m.industry,
                  university: mentorUser?.university || '',
                  college: mentorUser?.college || '',
              }
          }),
        };

        const result = await getPersonalizedRecommendations(recommendationInput);
        setRecommendations(result);
        setIsRecommendationsLoading(false);
      };
      getRecommendations();
    }
  }, [currentUser]);
  
  if (isUserLoading || !currentUser) {
    return (
      <>
        <Skeleton className="h-10 w-1/2 mb-8" />
        <div className="space-y-8">
          <section>
            <Skeleton className="h-8 w-1/3 mb-4" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <RecommendationSkeleton />
              <RecommendationSkeleton />
              <RecommendationSkeleton />
            </div>
          </section>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={`Welcome to ${currentUser.college}, ${currentUser.name}!`} />
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4">AI Recommendations For You</h2>
          {isRecommendationsLoading && !recommendations ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <RecommendationSkeleton />
                <RecommendationSkeleton />
                <RecommendationSkeleton />
             </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendations?.recommendedEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Events</CardTitle>
                    <CardDescription>Don't miss out on these upcoming events.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.recommendedEvents.map(event => (
                      <div key={event.id}>
                        <p className="font-semibold">{event.name}</p>
                        <p className="text-sm text-muted-foreground">{event.reasonsForRecommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">View all events <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  </CardFooter>
                </Card>
              )}

              {recommendations?.recommendedJobOpportunities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Job Opportunities</CardTitle>
                    <CardDescription>Explore career opportunities tailored to your profile.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.recommendedJobOpportunities.map(job => (
                      <div key={job.id}>
                        <p className="font-semibold">{job.title} at {job.company}</p>
                        <p className="text-sm text-muted-foreground">{job.reasonsForRecommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">View all jobs <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  </CardFooter>
                </Card>
              )}
              
              {recommendations?.recommendedMentors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Potential Mentors</CardTitle>
                    <CardDescription>Connect with experienced alumni.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recommendations.recommendedMentors.map(mentor => (
                      <div key={mentor.id}>
                        <p className="font-semibold">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">{mentor.reasonsForRecommendation}</p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">Find a mentor <ArrowRight className="ml-2 h-4 w-4"/></Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
