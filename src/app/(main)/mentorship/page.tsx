import { PageHeader } from '@/components/page-header';
import { mentors } from '@/lib/placeholder-data';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function MentorshipPage() {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.map((n) => n[0]).join('');
  };

  return (
    <>
      <PageHeader title="Mentorship Program">
        <div className="flex gap-2">
          <Input placeholder="Search mentors..." className="w-64" />
          <Button variant="outline">Become a Mentor</Button>
        </div>
      </PageHeader>
      <p className="text-muted-foreground mb-6">Find and connect with experienced alumni who can guide you in your career.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mentors.map((mentor) => (
          <Card key={mentor.id} className="text-center">
            <CardContent className="p-6">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={mentor.avatarUrl} alt={mentor.name} />
                <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold">{mentor.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{mentor.title}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary">{mentor.expertise}</Badge>
                {mentor.industry && <Badge variant="outline">{mentor.industry}</Badge>}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Connect</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
