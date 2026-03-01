'use client';

import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { ArrowRight, Star, GraduationCap, Briefcase, Users } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';
import type { User } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const getPlaceholderImage = (id: string) => {
    const img = PlaceHolderImages.find(p => p.id === id);
    if (!img) {
      return { imageUrl: "https://picsum.photos/seed/placeholder/1920/1080", description: 'Placeholder', imageHint: 'placeholder' };
    }
    return img;
}

function UserRatingCard({ user }: { user: User }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h4 className="font-bold text-lg leading-none">{user.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">{user.college}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span>Feedback Rating</span>
            <span className="text-primary flex items-center gap-1">
              {user.feedbackRating || 0}/100 <Star className="h-3 w-3 fill-current" />
            </span>
          </div>
          <Progress value={user.feedbackRating || 0} className="h-2" />
        </div>
        <div className="mt-4">
             <Link href={`/users/${user.id}`}>
                <Button variant="outline" size="sm" className="w-full">View Profile</Button>
             </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'users'),
      where('isVisibleInDirectory', '==', true)
    );
  }, [firestore]);

  const { data: allUsers, isLoading: isUsersLoading } = useCollection<User>(usersQuery);

  const heroImage = getPlaceholderImage('hero-home');
  const professorImage = getPlaceholderImage('professor-portrait');

  const students = allUsers?.filter(u => u.role === 'student').sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0)).slice(0, 3) || [];
  const professors = allUsers?.filter(u => u.role === 'professor').sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0)).slice(0, 3) || [];
  const staff = allUsers?.filter(u => u.role === 'non-teaching-staff').sort((a, b) => (b.feedbackRating || 0) - (a.feedbackRating || 0)).slice(0, 3) || [];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] w-full rounded-3xl overflow-hidden">
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover"
          data-ai-hint={heroImage.imageHint}
          priority
        />
        <div className="absolute inset-0 bg-primary/70" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white p-4">
          <h1 className="font-serif text-5xl font-bold md:text-7xl tracking-tight max-w-4xl">
            The future is in your hands
          </h1>
          <p className="mt-6 max-w-2xl text-xl text-white/90 font-body">
            Join thousands of alumni who have shaped their careers and legacy through the Nexus University network.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            {authUser ? (
              <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
              </Link>
            ) : (
              <>
                  <Link href="/login">
                      <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold">Join Today</Button>
                  </Link>
                  <Link href="/login">
                      <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white text-white hover:bg-white hover:text-primary">Login Now</Button>
                  </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Community Section - Ranked by Rating */}
      <section className="py-20">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="font-serif text-4xl font-bold mb-4">Meet Our Community</h2>
                  <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Discover top-rated members of our university, recognized for their contributions and excellence.</p>
              </div>

              {isUsersLoading ? (
                  <div className="grid gap-8 md:grid-cols-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
                  </div>
              ) : (
                  <Tabs defaultValue="students" className="w-full">
                      <div className="flex justify-center mb-8">
                          <TabsList className="grid w-full max-w-lg grid-cols-3">
                              <TabsTrigger value="students" className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" /> Students
                              </TabsTrigger>
                              <TabsTrigger value="professors" className="flex items-center gap-2">
                                  <Users className="h-4 w-4" /> Professors
                              </TabsTrigger>
                              <TabsTrigger value="staff" className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" /> Staff
                              </TabsTrigger>
                          </TabsList>
                      </div>
                      
                      <TabsContent value="students">
                          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                              {students.length > 0 ? (
                                  students.map(u => <UserRatingCard key={u.id} user={u} />)
                              ) : (
                                  <p className="text-center col-span-full text-muted-foreground py-10">No students found.</p>
                              )}
                          </div>
                      </TabsContent>
                      
                      <TabsContent value="professors">
                          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                              {professors.length > 0 ? (
                                  professors.map(u => <UserRatingCard key={u.id} user={u} />)
                              ) : (
                                  <p className="text-center col-span-full text-muted-foreground py-10">No professors found.</p>
                              )}
                          </div>
                      </TabsContent>

                      <TabsContent value="staff">
                          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                              {staff.length > 0 ? (
                                  staff.map(u => <UserRatingCard key={u.id} user={u} />)
                              ) : (
                                  <p className="text-center col-span-full text-muted-foreground py-10">No staff found.</p>
                              )}
                          </div>
                      </TabsContent>
                  </Tabs>
              )}
              
              <div className="text-center mt-12">
                  <Link href="/directory">
                      <Button size="lg" variant="link" className="text-primary font-bold">
                          View Full Directory <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                  </Link>
              </div>
          </div>
      </section>

      {/* Ranking Section */}
      <section className="bg-primary text-white py-20 rounded-3xl">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center px-4">
              <div className="max-w-xl">
                  <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight">We're Ranked Within the Top 5 Universities for Teaching Excellence</h2>
                  <p className="mt-6 text-lg text-white/70 leading-relaxed">Our commitment to academic brilliance is reflected in our community's success and global recognition.</p>
                  <Button size="lg" variant="secondary" className="mt-8 font-bold">Our Academic Excellence</Button>
              </div>
              <div className="flex justify-center">
                  <div className="relative">
                      <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                      <Image src={professorImage.imageUrl} alt={professorImage.description} width={450} height={450} className="rounded-full object-cover aspect-square border-8 border-white/20 shadow-2xl relative z-10" data-ai-hint={professorImage.imageHint} />
                  </div>
              </div>
          </div>
      </section>
    </div>
  );
}
