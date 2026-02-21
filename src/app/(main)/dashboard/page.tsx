import {
  getPersonalizedRecommendations,
  PersonalizedRecommendationsInput,
} from '@/ai/flows/recommendation-engine';
import { PageHeader } from '@/components/page-header';
import { users, events, jobPosts, mentors } from '@/lib/placeholder-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  // In a real app, you'd get the logged-in user's data
  const currentUser = users[0];

  const recommendationInput: PersonalizedRecommendationsInput = {
    userProfile: {
      userId: currentUser.id,
      userType: currentUser.role,
      major: currentUser.role === 'student' ? currentUser.major : undefined,
      graduationYear: currentUser.role === 'student' ? currentUser.graduationYear : undefined,
      preferences: currentUser.preferences,
    },
    engagementData: {
      networkActivity: currentUser.networkActivity,
    },
    availableEvents: events.map(e => ({ id: e.id, name: e.name, description: e.description, tags: e.tags })),
    availableJobOpportunities: jobPosts.map(j => ({ id: j.id, title: j.title, company: j.company, description: j.description, industry: j.industry })),
    availableMentors: mentors.map(m => ({ id: m.id, name: m.name, expertise: m.expertise, industry: m.industry })),
  };

  const recommendations = await getPersonalizedRecommendations(recommendationInput);

  return (
    <>
      <PageHeader title={`Welcome back, ${currentUser.name}!`} />
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold font-headline mb-4">AI Recommendations For You</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.recommendedEvents.length > 0 && (
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

            {recommendations.recommendedJobOpportunities.length > 0 && (
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
            
            {recommendations.recommendedMentors.length > 0 && (
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
        </section>
      </div>
    </>
  );
}
